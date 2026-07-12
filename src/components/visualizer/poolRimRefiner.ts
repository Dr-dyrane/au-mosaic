import type { Pt } from "./types";
import type { PoolShell } from "./poolAccuracy";
import { buildShellFaces } from "./shell";
import { clamp, isValidQuad } from "./geometry";

export type LumaImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type PoolRimRefineResult = {
  shell: PoolShell;
  refinedSides: number;
  strength: number;
};

type LineCandidate = { y: number; score: number };

function pixel(luma: LumaImage, x: number, y: number): number {
  const px = Math.round(clamp(x, 0, luma.width - 1));
  const py = Math.round(clamp(y, 0, luma.height - 1));
  return luma.data[py * luma.width + px];
}

function lineContrast(luma: LumaImage, far: Pt, near: Pt): number {
  const ax = far.x * (luma.width - 1);
  const ay = far.y * (luma.height - 1);
  const bx = near.x * (luma.width - 1);
  const by = near.y * (luma.height - 1);
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  if (length < 8) return 0;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = Math.max(1, Math.round(Math.max(luma.width, luma.height) / 192));
  let score = 0;
  const samples = 96;
  for (let i = 0; i < samples; i += 1) {
    const t = 0.18 + (0.78 * i) / (samples - 1);
    const x = ax + dx * t;
    const y = ay + dy * t;
    score += Math.abs(
      pixel(luma, x + nx * offset, y + ny * offset) -
      pixel(luma, x - nx * offset, y - ny * offset),
    );
  }
  return score / samples;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function findPoolWallInnerEdge(
  luma: LumaImage,
  far: Pt,
  near: Pt,
  floorNear: Pt,
): { y: number; strength: number } | null {
  if (
    luma.width < 24 ||
    luma.height < 24 ||
    luma.data.length !== luma.width * luma.height
  ) return null;
  const start = near.y + Math.max(0.01, 2 / luma.height);
  const end = Math.min(near.y + 0.12, floorNear.y - 0.08);
  if (end <= start) return null;

  const candidates: LineCandidate[] = [];
  for (let y = start; y <= end; y += 1 / luma.height) {
    candidates.push({ y, score: lineContrast(luma, far, { x: near.x, y }) });
  }
  const best = candidates.reduce((winner, candidate) =>
    candidate.score > winner.score ? candidate : winner,
  );
  const localMedian = median(candidates.map((candidate) => candidate.score));
  if (best.score < 10 || best.score < localMedian * 1.45) return null;

  const cluster = candidates.filter((candidate) =>
    candidate.score >= best.score * 0.82 && Math.abs(candidate.y - best.y) <= 0.015,
  );
  const weight = cluster.reduce((sum, candidate) => sum + candidate.score, 0);
  if (!weight) return null;
  const y = cluster.reduce((sum, candidate) => sum + candidate.y * candidate.score, 0) / weight;
  return {
    y: clamp(y, start, end),
    strength: best.score / Math.max(1, localMedian),
  };
}

/* SAM gives the visible wall and floor extents, but a side mask may include
   the coping above it. Search just below that rim for the stronger inner
   architectural edge, keeping all shared x coordinates and floor seams. */
export function refinePoolRimWithLuma(
  shell: PoolShell,
  luma: LumaImage,
): PoolRimRefineResult {
  const rim = shell.rim.map((point) => ({ ...point }));
  const left = findPoolWallInnerEdge(luma, rim[0], rim[3], shell.floor[3]);
  const right = findPoolWallInnerEdge(luma, rim[1], rim[2], shell.floor[2]);
  if (left) rim[3].y = left.y;
  if (right) rim[2].y = right.y;

  const next = { rim, floor: shell.floor };
  const valid = isValidQuad(next.rim) &&
    buildShellFaces(next.rim, next.floor).every((face) => !face.visible || isValidQuad(face.quad));
  if (!valid) return { shell, refinedSides: 0, strength: 0 };
  const strengths = [left?.strength, right?.strength].filter((value): value is number => value !== undefined);
  return {
    shell: next,
    refinedSides: strengths.length,
    strength: strengths.length ? strengths.reduce((sum, value) => sum + value, 0) / strengths.length : 0,
  };
}
