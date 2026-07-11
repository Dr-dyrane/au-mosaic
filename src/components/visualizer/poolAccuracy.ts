import type { Pt, ShellFaceId } from "./types";
import { buildShellFaces } from "./shell";

export type PoolShell = {
  rim: Pt[];
  floor: Pt[];
};

export type PoolShellAcceptance = {
  cornerToleranceDiagonal: number;
  minFaceIoU: number;
  minMeanFaceIoU: number;
};

export type PoolShellAccuracy = {
  cornerErrors: number[];
  meanCornerError: number;
  maxCornerError: number;
  cornersOutsideTolerance: number;
  faceIoU: Record<VisibleShellFaceId, number>;
  meanFaceIoU: number;
  minFaceIoU: number;
  passes: boolean;
};

type PixelSize = { width: number; height: number };
type VisibleShellFaceId = Exclude<ShellFaceId, "near">;

const VISIBLE_FACES: VisibleShellFaceId[] = ["back", "left", "right", "floor"];
const EPSILON = 1e-9;

function assertShell(shell: PoolShell): void {
  if (shell.rim.length !== 4 || shell.floor.length !== 4) {
    throw new Error("pool-shell-needs-eight-points");
  }
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pixelPoint(point: Pt, size: PixelSize): Pt {
  return { x: point.x * size.width, y: point.y * size.height };
}

function signedArea(polygon: Pt[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    area += polygon[i].x * next.y - next.x * polygon[i].y;
  }
  return area / 2;
}

function polygonArea(polygon: Pt[]): number {
  return Math.abs(signedArea(polygon));
}

function cross(a: Pt, b: Pt, p: Pt): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function lineIntersection(start: Pt, end: Pt, clipStart: Pt, clipEnd: Pt): Pt {
  const sx = end.x - start.x;
  const sy = end.y - start.y;
  const cx = clipEnd.x - clipStart.x;
  const cy = clipEnd.y - clipStart.y;
  const denominator = sx * cy - sy * cx;
  if (Math.abs(denominator) < EPSILON) return end;
  const dx = clipStart.x - start.x;
  const dy = clipStart.y - start.y;
  const t = (dx * cy - dy * cx) / denominator;
  return { x: start.x + t * sx, y: start.y + t * sy };
}

/* Convex Sutherland-Hodgman clipping. Pool faces are convex quads, so
   exact polygon area is cheaper and steadier than a raster approximation. */
function intersectConvex(subject: Pt[], clip: Pt[]): Pt[] {
  if (subject.length < 3 || clip.length < 3) return [];
  const orientation = signedArea(clip) >= 0 ? 1 : -1;
  let output = [...subject];
  for (let i = 0; i < clip.length; i += 1) {
    const clipStart = clip[i];
    const clipEnd = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    if (!input.length) break;
    let start = input[input.length - 1];
    for (const end of input) {
      const endInside = orientation * cross(clipStart, clipEnd, end) >= -EPSILON;
      const startInside = orientation * cross(clipStart, clipEnd, start) >= -EPSILON;
      if (endInside) {
        if (!startInside) output.push(lineIntersection(start, end, clipStart, clipEnd));
        output.push(end);
      } else if (startInside) {
        output.push(lineIntersection(start, end, clipStart, clipEnd));
      }
      start = end;
    }
  }
  return output;
}

export function convexIoU(a: Pt[], b: Pt[], size: PixelSize): number {
  const pa = a.map((point) => pixelPoint(point, size));
  const pb = b.map((point) => pixelPoint(point, size));
  const areaA = polygonArea(pa);
  const areaB = polygonArea(pb);
  if (areaA <= EPSILON || areaB <= EPSILON) return 0;
  const intersection = polygonArea(intersectConvex(pa, pb));
  const union = areaA + areaB - intersection;
  return union > EPSILON ? intersection / union : 0;
}

export function cornerErrors(predicted: PoolShell, gold: PoolShell, size: PixelSize): number[] {
  assertShell(predicted);
  assertShell(gold);
  const diagonal = Math.hypot(size.width, size.height);
  if (!diagonal) throw new Error("pool-image-needs-size");
  const predictedPoints = [...predicted.rim, ...predicted.floor];
  const goldPoints = [...gold.rim, ...gold.floor];
  return predictedPoints.map((point, index) => {
    const target = goldPoints[index];
    return Math.hypot(
      (point.x - target.x) * size.width,
      (point.y - target.y) * size.height,
    ) / diagonal;
  });
}

function visibleFaces(shell: PoolShell): Record<VisibleShellFaceId, Pt[]> {
  const out = {} as Record<VisibleShellFaceId, Pt[]>;
  for (const face of buildShellFaces(shell.rim, shell.floor)) {
    if (face.visible) out[face.id as VisibleShellFaceId] = face.quad;
  }
  return out;
}

export function scorePoolShell(
  predicted: PoolShell,
  gold: PoolShell,
  size: PixelSize,
  acceptance: PoolShellAcceptance,
): PoolShellAccuracy {
  const errors = cornerErrors(predicted, gold, size);
  const predictedFaces = visibleFaces(predicted);
  const goldFaces = visibleFaces(gold);
  const faceIoU = {} as Record<VisibleShellFaceId, number>;
  for (const face of VISIBLE_FACES) {
    faceIoU[face] = convexIoU(predictedFaces[face], goldFaces[face], size);
  }
  const faceScores = VISIBLE_FACES.map((face) => faceIoU[face]);
  const meanCornerError = mean(errors);
  const maxCornerError = Math.max(...errors);
  const cornersOutsideTolerance = errors.filter(
    (error) => error > acceptance.cornerToleranceDiagonal,
  ).length;
  const meanFaceIoU = mean(faceScores);
  const minFaceIoU = Math.min(...faceScores);
  return {
    cornerErrors: errors,
    meanCornerError,
    maxCornerError,
    cornersOutsideTolerance,
    faceIoU,
    meanFaceIoU,
    minFaceIoU,
    passes:
      cornersOutsideTolerance === 0 &&
      minFaceIoU >= acceptance.minFaceIoU &&
      meanFaceIoU >= acceptance.minMeanFaceIoU,
  };
}
