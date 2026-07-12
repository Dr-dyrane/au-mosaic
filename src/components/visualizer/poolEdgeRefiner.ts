import type { Pt } from "./types";
import type { PoolShell } from "./poolAccuracy";
import type { BinaryMask } from "./fitMask";
import type { LumaImage } from "./poolRimRefiner";
import { buildShellFaces } from "./shell";
import { isValidQuad } from "./geometry";

type PixelSize = { width: number; height: number };
type Line = { a: number; b: number; c: number };

export type PoolEdgeRefineResult = {
  shell: PoolShell;
  backInsetsPx: BackInsets;
  nearAligned: boolean;
};

type BackInsets = { top: number; right: number; bottom: number; left: number };

const EPSILON = 1e-8;

function pixelPoint(point: Pt, size: PixelSize): Pt {
  return { x: point.x * size.width, y: point.y * size.height };
}

function normalizedPoint(point: Pt, size: PixelSize): Pt {
  return { x: point.x / size.width, y: point.y / size.height };
}

function lineThrough(start: Pt, end: Pt): Line | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < EPSILON) return null;
  return {
    a: dy / length,
    b: -dx / length,
    c: -(dy * start.x - dx * start.y) / length,
  };
}

function intersection(first: Line, second: Line): Pt | null {
  const determinant = first.a * second.b - second.a * first.b;
  if (Math.abs(determinant) < EPSILON) return null;
  const point = {
    x: (first.b * second.c - second.b * first.c) / determinant,
    y: (first.c * second.a - second.c * first.a) / determinant,
  };
  return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
}

function insetQuad(quad: Pt[], amounts: readonly number[]): Pt[] | null {
  const centre = quad.reduce(
    (sum, point) => ({ x: sum.x + point.x / quad.length, y: sum.y + point.y / quad.length }),
    { x: 0, y: 0 },
  );
  const lines: Line[] = [];
  for (let index = 0; index < quad.length; index += 1) {
    const start = quad[index];
    const end = quad[(index + 1) % quad.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < EPSILON) return null;
    let nx = -dy / length;
    let ny = dx / length;
    const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    if ((centre.x - midpoint.x) * nx + (centre.y - midpoint.y) * ny < 0) {
      nx *= -1;
      ny *= -1;
    }
    const amount = amounts[index] ?? 0;
    const shiftedStart = { x: start.x + nx * amount, y: start.y + ny * amount };
    const shiftedEnd = { x: end.x + nx * amount, y: end.y + ny * amount };
    const line = lineThrough(shiftedStart, shiftedEnd);
    if (!line) return null;
    lines.push(line);
  }
  const inset: Pt[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const point = intersection(lines[(index + lines.length - 1) % lines.length], lines[index]);
    if (!point) return null;
    inset.push(point);
  }
  return inset;
}

function alignNearFloor(
  rim: Pt[],
  floor: Pt[],
  insetPx: number,
  size: PixelSize,
): Pt[] | null {
  const leftNear = lineThrough(pixelPoint(rim[3], size), pixelPoint(floor[3], size));
  const rightNear = lineThrough(pixelPoint(rim[2], size), pixelPoint(floor[2], size));
  if (!leftNear || !rightNear) return null;

  const backStart = pixelPoint(rim[0], size);
  const backEnd = pixelPoint(rim[1], size);
  const dx = backEnd.x - backStart.x;
  const dy = backEnd.y - backStart.y;
  const length = Math.hypot(dx, dy);
  if (length < EPSILON) return null;
  const tangent = { x: dx / length, y: dy / length };
  const nearLeft = pixelPoint(floor[3], size);
  const nearRight = pixelPoint(floor[2], size);
  const midpoint = {
    x: (nearLeft.x + nearRight.x) / 2,
    y: (nearLeft.y + nearRight.y) / 2,
  };
  const floorCentre = floor.reduce(
    (sum, point) => {
      const pixel = pixelPoint(point, size);
      return { x: sum.x + pixel.x / floor.length, y: sum.y + pixel.y / floor.length };
    },
    { x: 0, y: 0 },
  );
  let normal = { x: -tangent.y, y: tangent.x };
  if ((floorCentre.x - midpoint.x) * normal.x + (floorCentre.y - midpoint.y) * normal.y < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  const anchor = {
    x: midpoint.x + normal.x * insetPx * 0.25,
    y: midpoint.y + normal.y * insetPx * 0.25,
  };
  const nearLine = lineThrough(
    { x: anchor.x - tangent.x, y: anchor.y - tangent.y },
    { x: anchor.x + tangent.x, y: anchor.y + tangent.y },
  );
  if (!nearLine) return null;
  const nextLeft = intersection(nearLine, leftNear);
  const nextRight = intersection(nearLine, rightNear);
  if (!nextLeft || !nextRight) return null;
  const maxMove = insetPx * 2;
  if (
    Math.hypot(nextLeft.x - nearLeft.x, nextLeft.y - nearLeft.y) > maxMove ||
    Math.hypot(nextRight.x - nearRight.x, nextRight.y - nearRight.y) > maxMove
  ) return null;
  const next = [...floor];
  next[3] = normalizedPoint(nextLeft, size);
  next[2] = normalizedPoint(nextRight, size);
  return next;
}

export function isStablePoolShell(shell: PoolShell): boolean {
  return isValidQuad(shell.rim) &&
    isValidQuad(shell.floor) &&
    buildShellFaces(shell.rim, shell.floor).every((face) => isValidQuad(face.quad));
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sampleLuma(luma: LumaImage, x: number, y: number): number {
  const px = Math.max(0, Math.min(luma.width - 1, x));
  const py = Math.max(0, Math.min(luma.height - 1, y));
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(luma.width - 1, x0 + 1);
  const y1 = Math.min(luma.height - 1, y0 + 1);
  const tx = px - x0;
  const ty = py - y0;
  const top = luma.data[y0 * luma.width + x0] * (1 - tx) +
    luma.data[y0 * luma.width + x1] * tx;
  const bottom = luma.data[y1 * luma.width + x0] * (1 - tx) +
    luma.data[y1 * luma.width + x1] * tx;
  return top * (1 - ty) + bottom * ty;
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

function edgeEvidence(
  luma: LumaImage,
  start: Pt,
  end: Pt,
  inward: Pt,
  offset: number,
): { evidence: number; consistency: number } {
  const values: number[] = [];
  const samples = 96;
  for (let index = 0; index < samples; index += 1) {
    const t = 0.06 + (0.88 * index) / (samples - 1);
    const x = start.x + (end.x - start.x) * t + inward.x * offset;
    const y = start.y + (end.y - start.y) * t + inward.y * offset;
    const outside = sampleLuma(luma, x - inward.x * 1.5, y - inward.y * 1.5);
    const inside = sampleLuma(luma, x + inward.x * 1.5, y + inward.y * 1.5);
    values.push(inside - outside);
  }
  const positive = values.filter((value) => value >= 0);
  const negative = values.filter((value) => value < 0).map((value) => -value);
  const dominant = positive.length >= negative.length ? positive : negative;
  return {
    evidence: percentile(dominant, 0.5) * 0.55 + percentile(dominant, 0.75) * 0.45,
    consistency: dominant.length / values.length,
  };
}

function detectedTopInset(
  shell: PoolShell,
  size: PixelSize,
  luma: LumaImage | undefined,
  scale: number,
): number {
  if (
    !luma ||
    luma.width !== size.width ||
    luma.height !== size.height ||
    luma.data.length !== size.width * size.height
  ) return 0;
  const start = pixelPoint(shell.rim[0], size);
  const end = pixelPoint(shell.rim[1], size);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 8) return 0;
  let inward = { x: -dy / length, y: dx / length };
  const backCentre = {
    x: (shell.floor[0].x + shell.floor[1].x) * size.width / 2,
    y: (shell.floor[0].y + shell.floor[1].y) * size.height / 2,
  };
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  if ((backCentre.x - midpoint.x) * inward.x + (backCentre.y - midpoint.y) * inward.y < 0) {
    inward = { x: -inward.x, y: -inward.y };
  }
  const current = edgeEvidence(luma, start, end, inward, 0);
  let best = { offset: 0, ...current, score: current.evidence };
  for (let offset = 0.5; offset <= scale * 1.6; offset += 0.5) {
    const candidate = edgeEvidence(luma, start, end, inward, offset);
    const score = candidate.evidence * (0.65 + candidate.consistency * 0.35) - offset * 0.35;
    if (score > best.score) best = { offset, ...candidate, score };
  }
  if (
    best.offset === 0 ||
    best.evidence < 10 ||
    best.evidence < current.evidence * 1.5 ||
    best.consistency < 0.75
  ) return 0;
  return Math.min(scale * 1.2, best.offset + scale * 0.2);
}

function sideDeviation(
  mask: BinaryMask,
  useLeft: boolean,
  shell: PoolShell,
  size: PixelSize,
): number {
  const edge: Pt[] = [];
  const startY = Math.max(shell.rim[0].y, shell.rim[1].y) * size.height;
  const endY = Math.min(shell.floor[0].y, shell.floor[1].y) * size.height;
  for (let y = Math.ceil(startY); y <= Math.floor(endY); y += 1) {
    if (useLeft) {
      for (let x = 0; x < mask.width; x += 1) {
        if (mask.data[y * mask.width + x]) {
          edge.push({ x, y });
          break;
        }
      }
    } else {
      for (let x = mask.width - 1; x >= 0; x -= 1) {
        if (mask.data[y * mask.width + x]) {
          edge.push({ x, y });
          break;
        }
      }
    }
  }
  if (edge.length < 8) return 0;
  const centreY = edge.reduce((sum, point) => sum + point.y, 0) / edge.length;
  const centreX = edge.reduce((sum, point) => sum + point.x, 0) / edge.length;
  let yy = 0;
  let xy = 0;
  edge.forEach((point) => {
    yy += (point.y - centreY) ** 2;
    xy += (point.y - centreY) * (point.x - centreX);
  });
  const slope = yy > EPSILON ? xy / yy : 0;
  return median(edge.map((point) =>
    Math.abs(point.x - (centreX + slope * (point.y - centreY)))));
}

function backInsets(
  shell: PoolShell,
  size: PixelSize,
  mask?: BinaryMask,
  luma?: LumaImage,
): BackInsets {
  const scale = Math.max(1, Math.min(6, Math.max(size.width, size.height) / 192));
  const horizontal = detectedTopInset(shell, size, luma, scale);
  if (!horizontal) return { top: 0, right: 0, bottom: 0, left: 0 };
  const vertical = (deviation: number) =>
    Math.min(scale * 1.2, scale * 0.2 + deviation * 0.48);
  const usableMask = mask &&
    mask.width === size.width &&
    mask.height === size.height &&
    mask.data.length === size.width * size.height
    ? mask
    : undefined;
  return {
    top: horizontal,
    right: vertical(usableMask ? sideDeviation(usableMask, false, shell, size) : 0),
    bottom: horizontal,
    left: vertical(usableMask ? sideDeviation(usableMask, true, shell, size) : 0),
  };
}

/* SAM boundaries are resampled from low-resolution logits. A tiny inward
   inset keeps the projective sheet on the usable face instead of letting a
   coping or an adjacent plane own those uncertain edge pixels. The near
   floor seam then follows the same cross-pool direction as the back wall,
   which removes mask stair-step tilt without assuming a level camera. */
export function stabilizePoolShellEdges(
  shell: PoolShell,
  size: PixelSize,
  backMask?: BinaryMask,
  luma?: LumaImage,
): PoolEdgeRefineResult {
  const none: BackInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  if (size.width < 24 || size.height < 24 || !isStablePoolShell(shell)) {
    return { shell, backInsetsPx: none, nearAligned: false };
  }
  const insets = backInsets(shell, size, backMask, luma);
  if (!insets.top) return { shell, backInsetsPx: none, nearAligned: false };
  const backQuad = [shell.rim[0], shell.rim[1], shell.floor[1], shell.floor[0]]
    .map((point) => pixelPoint(point, size));
  const inset = insetQuad(backQuad, [insets.top, insets.right, insets.bottom, insets.left]);
  if (!inset) return { shell, backInsetsPx: none, nearAligned: false };

  const rim = shell.rim.map((point) => ({ ...point }));
  let floor = shell.floor.map((point) => ({ ...point }));
  rim[0] = normalizedPoint(inset[0], size);
  rim[1] = normalizedPoint(inset[1], size);
  floor[1] = normalizedPoint(inset[2], size);
  floor[0] = normalizedPoint(inset[3], size);
  const aligned = alignNearFloor(rim, floor, insets.top, size);
  if (aligned) floor = aligned;

  const next = { rim, floor };
  if (!isStablePoolShell(next)) return { shell, backInsetsPx: none, nearAligned: false };
  return { shell: next, backInsetsPx: insets, nearAligned: Boolean(aligned) };
}
