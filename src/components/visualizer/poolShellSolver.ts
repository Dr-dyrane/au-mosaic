import type { Pt, ShellFaceId } from "./types";
import type { BinaryMask } from "./fitMask";
import { fillHoles, largestComponent, morphClose, morphOpen } from "./fitMask";
import { clamp, isValidQuad } from "./geometry";
import { buildShellFaces } from "./shell";
import type { PoolShell } from "./poolAccuracy";

export type VisiblePoolFaceId = Exclude<ShellFaceId, "near">;
export type PoolFaceMasks = Record<VisiblePoolFaceId, BinaryMask>;

export type PoolShellSolveResult = {
  shell: PoolShell;
  confidence: number;
  lineConfidence: Record<PoolShellLineId, number>;
  requiresRefinement: boolean;
};

type Line = {
  a: number;
  b: number;
  c: number;
  confidence: number;
};

type EnvelopeSide = "top" | "bottom" | "left" | "right";
type PoolShellLineId =
  | "backRim"
  | "leftRim"
  | "rightRim"
  | "backFloor"
  | "leftFloor"
  | "rightFloor"
  | "leftNear"
  | "rightNear"
  | "nearFloor";

const FACE_IDS: VisiblePoolFaceId[] = ["back", "left", "right", "floor"];
const CONTACT_RADIUS = 5;
const LINE_TOLERANCE_PX = 2.5;
const MIN_LINE_POINTS = 8;
const MAX_LINE_SAMPLES = 1600;
const EPSILON = 1e-8;

function sameMaskSize(masks: PoolFaceMasks): { width: number; height: number } | null {
  const first = masks.back;
  if (!first.width || !first.height || first.data.length !== first.width * first.height) return null;
  for (const face of FACE_IDS) {
    const mask = masks[face];
    if (
      mask.width !== first.width ||
      mask.height !== first.height ||
      mask.data.length !== first.width * first.height
    ) return null;
  }
  return { width: first.width, height: first.height };
}

function cleanMasks(masks: PoolFaceMasks): PoolFaceMasks | null {
  const cleaned = {} as PoolFaceMasks;
  for (const face of FACE_IDS) {
    const component = largestComponent(fillHoles(morphClose(morphOpen(masks[face]))));
    if (!component) return null;
    cleaned[face] = component;
  }
  return cleaned;
}

function envelope(mask: BinaryMask, side: EnvelopeSide): Pt[] {
  const { data, width, height } = mask;
  const points: Pt[] = [];
  if (side === "top" || side === "bottom") {
    for (let x = 0; x < width; x += 1) {
      if (side === "top") {
        for (let y = 0; y < height; y += 1) {
          if (data[y * width + x]) {
            points.push({ x, y });
            break;
          }
        }
      } else {
        for (let y = height - 1; y >= 0; y -= 1) {
          if (data[y * width + x]) {
            points.push({ x, y });
            break;
          }
        }
      }
    }
    return points;
  }
  for (let y = 0; y < height; y += 1) {
    if (side === "left") {
      for (let x = 0; x < width; x += 1) {
        if (data[y * width + x]) {
          points.push({ x, y });
          break;
        }
      }
    } else {
      for (let x = width - 1; x >= 0; x -= 1) {
        if (data[y * width + x]) {
          points.push({ x, y });
          break;
        }
      }
    }
  }
  return points;
}

function boundaryBits(mask: BinaryMask): Uint8Array {
  const { data, width, height } = mask;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!data[index]) continue;
      if (
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !data[index - 1] ||
        !data[index + 1] ||
        !data[index - width] ||
        !data[index + width]
      ) out[index] = 1;
    }
  }
  return out;
}

function hasBoundaryNear(
  boundary: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
): boolean {
  for (let dy = -radius; dy <= radius; dy += 1) {
    const ny = y + dy;
    if (ny < 0 || ny >= height) continue;
    for (let dx = -radius; dx <= radius; dx += 1) {
      const nx = x + dx;
      if (nx >= 0 && nx < width && boundary[ny * width + nx]) return true;
    }
  }
  return false;
}

function contactBoundary(first: BinaryMask, second: BinaryMask): Pt[] {
  const width = first.width;
  const height = first.height;
  const firstBoundary = boundaryBits(first);
  const secondBoundary = boundaryBits(second);
  const points: Pt[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (
        (firstBoundary[index] && hasBoundaryNear(secondBoundary, width, height, x, y, CONTACT_RADIUS)) ||
        (secondBoundary[index] && hasBoundaryNear(firstBoundary, width, height, x, y, CONTACT_RADIUS))
      ) points.push({ x, y });
    }
  }
  return points;
}

function refitLine(points: Pt[]): Omit<Line, "confidence"> | null {
  if (points.length < 2) return null;
  const centre = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  centre.x /= points.length;
  centre.y /= points.length;
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const point of points) {
    const dx = point.x - centre.x;
    const dy = point.y - centre.y;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  const vx = Math.cos(angle);
  const vy = Math.sin(angle);
  const a = vy;
  const b = -vx;
  return { a, b, c: -(a * centre.x + b * centre.y) };
}

function robustLine(points: Pt[]): Line | null {
  if (points.length < MIN_LINE_POINTS) return null;
  let state = 7;
  const randomIndex = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % points.length;
  };
  let best: Pt[] = [];
  let bestError = Infinity;
  const samples = Math.min(MAX_LINE_SAMPLES, points.length * 8);
  for (let sample = 0; sample < samples; sample += 1) {
    const first = points[randomIndex()];
    const second = points[randomIndex()];
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const length = Math.hypot(dx, dy);
    if (length < 8) continue;
    const a = dy / length;
    const b = -dx / length;
    const c = -(a * first.x + b * first.y);
    const inliers: Pt[] = [];
    let error = 0;
    for (const point of points) {
      const distance = Math.abs(a * point.x + b * point.y + c);
      if (distance <= LINE_TOLERANCE_PX) {
        inliers.push(point);
        error += distance;
      }
    }
    const meanError = inliers.length ? error / inliers.length : Infinity;
    if (inliers.length > best.length || (inliers.length === best.length && meanError < bestError)) {
      best = inliers;
      bestError = meanError;
    }
  }
  if (best.length < MIN_LINE_POINTS) return null;
  const fitted = refitLine(best);
  return fitted ? { ...fitted, confidence: best.length / points.length } : null;
}

function intersection(first: Line, second: Line): Pt | null {
  const determinant = first.a * second.b - second.a * first.b;
  if (Math.abs(determinant) < EPSILON) return null;
  return {
    x: (first.b * second.c - second.b * first.c) / determinant,
    y: (first.c * second.a - second.c * first.a) / determinant,
  };
}

function lineEndpoints(points: Pt[], line: Line): [Pt, Pt] | null {
  if (points.length < 2) return null;
  const direction = { x: -line.b, y: line.a };
  const origin = { x: -line.c * line.a, y: -line.c * line.b };
  const distances = points
    .map((point) => (point.x - origin.x) * direction.x + (point.y - origin.y) * direction.y)
    .sort((a, b) => a - b);
  const at = (ratio: number) => distances[Math.min(distances.length - 1, Math.max(0, Math.floor((distances.length - 1) * ratio)))];
  const make = (distance: number): Pt => ({
    x: origin.x + distance * direction.x,
    y: origin.y + distance * direction.y,
  });
  return [make(at(0.01)), make(at(0.99))];
}

function endpointByX(points: Pt[], line: Line, useMinimum: boolean): Pt | null {
  const ends = lineEndpoints(points, line);
  if (!ends) return null;
  return useMinimum === (ends[0].x <= ends[1].x) ? ends[0] : ends[1];
}

function averagePoint(first: Pt | null, second: Pt | null): Pt | null {
  if (!first || !second) return first ?? second;
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function normalized(point: Pt | null, width: number, height: number): Pt | null {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return {
    x: clamp(point.x / width, 0.02, 0.98),
    y: clamp(point.y / height, 0.02, 0.98),
  };
}

export function solvePoolShellFromMasks(masks: PoolFaceMasks): PoolShellSolveResult | null {
  const size = sameMaskSize(masks);
  if (!size) return null;
  const prepared = cleanMasks(masks);
  if (!prepared) return null;
  const backTopPoints = envelope(prepared.back, "top");
  const leftTopPoints = envelope(prepared.left, "top");
  const rightTopPoints = envelope(prepared.right, "top");
  const floorBottomPoints = envelope(prepared.floor, "bottom");
  const sourcePoints: Record<PoolShellLineId, Pt[]> = {
    backRim: backTopPoints,
    leftRim: leftTopPoints,
    rightRim: rightTopPoints,
    backFloor: contactBoundary(prepared.back, prepared.floor),
    leftFloor: contactBoundary(prepared.left, prepared.floor),
    rightFloor: contactBoundary(prepared.right, prepared.floor),
    leftNear: envelope(prepared.left, "left"),
    rightNear: envelope(prepared.right, "right"),
    nearFloor: floorBottomPoints,
  };
  const lines = {} as Record<PoolShellLineId, Line>;
  for (const id of Object.keys(sourcePoints) as PoolShellLineId[]) {
    const line = robustLine(sourcePoints[id]);
    if (!line) return null;
    lines[id] = line;
  }

  /* Adjacent SAM masks often stop two or three pixels apart. Their observed
     endpoints are a steadier shared rim corner than intersecting two almost
     parallel fitted lines far outside the evidence. */
  const rimTopLeft = averagePoint(
    endpointByX(backTopPoints, lines.backRim, true),
    endpointByX(leftTopPoints, lines.leftRim, false),
  );
  const rimTopRight = averagePoint(
    endpointByX(backTopPoints, lines.backRim, false),
    endpointByX(rightTopPoints, lines.rightRim, true),
  );
  const rawRim = [
    rimTopLeft,
    rimTopRight,
    endpointByX(rightTopPoints, lines.rightRim, false),
    endpointByX(leftTopPoints, lines.leftRim, true),
  ];
  const rawFloor = [
    intersection(lines.backFloor, lines.leftFloor),
    intersection(lines.backFloor, lines.rightFloor),
    intersection(lines.nearFloor, lines.rightNear),
    intersection(lines.nearFloor, lines.leftNear),
  ];
  const rim = rawRim.map((point) => normalized(point, size.width, size.height));
  const floor = rawFloor.map((point) => normalized(point, size.width, size.height));
  if (rim.some((point) => !point) || floor.some((point) => !point)) return null;
  const shell: PoolShell = { rim: rim as Pt[], floor: floor as Pt[] };
  if (!isValidQuad(shell.floor)) return null;
  if (buildShellFaces(shell.rim, shell.floor).some((face) => !isValidQuad(face.quad))) {
    return null;
  }
  const requiresRefinement = !isValidQuad(shell.rim);

  const lineConfidence = Object.fromEntries(
    (Object.keys(lines) as PoolShellLineId[]).map((id) => [id, lines[id].confidence]),
  ) as Record<PoolShellLineId, number>;
  const confidence = Object.values(lineConfidence).reduce((sum, value) => sum + value, 0) /
    Object.values(lineConfidence).length;
  return { shell, confidence, lineConfidence, requiresRefinement };
}
