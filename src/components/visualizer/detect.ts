import type { SurfaceId, SnapResult } from "./types";
import { clamp } from "./geometry";
import { SURFACES } from "./constants";

function detectSurfaceFrame(source: CanvasImageSource, sourceW: number, sourceH: number, surface: SurfaceId): SnapResult | null {
  if (sourceW < 80 || sourceH < 80) return null;

  const maxSide = 360;
  const scale = Math.min(1, maxSide / Math.max(sourceW, sourceH));
  const w = Math.max(80, Math.round(sourceW * scale));
  const h = Math.max(80, Math.round(sourceH * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const lum = new Float32Array(w * h);
  for (let i = 0, j = 0; i < pixels.length; i += 4, j += 1) {
    lum[j] = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
  }

  const edgeX = new Float32Array(w * h);
  const edgeY = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      edgeX[i] = Math.abs(lum[i + 1] - lum[i - 1]);
      edgeY[i] = Math.abs(lum[i + w] - lum[i - w]);
    }
  }

  const smooth = (scores: Float32Array) => {
    const next = new Float32Array(scores.length);
    for (let i = 0; i < scores.length; i += 1) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(scores.length - 1, i + 2); j += 1) {
        sum += scores[j];
        count += 1;
      }
      next[i] = sum / count;
    }
    return next;
  };

  const rowScores = (x0 = 0.05, x1 = 0.95) => {
    const scores = new Float32Array(h);
    const startX = Math.round(w * x0);
    const endX = Math.round(w * x1);
    for (let y = 1; y < h - 1; y += 1) {
      let sum = 0;
      for (let x = startX; x < endX; x += 1) sum += edgeY[y * w + x];
      scores[y] = sum / Math.max(1, endX - startX);
    }
    return smooth(scores);
  };

  const columnScores = (y0 = 0.05, y1 = 0.95) => {
    const scores = new Float32Array(w);
    const startY = Math.round(h * y0);
    const endY = Math.round(h * y1);
    for (let x = 1; x < w - 1; x += 1) {
      let sum = 0;
      for (let y = startY; y < endY; y += 1) sum += edgeX[y * w + x];
      scores[x] = sum / Math.max(1, endY - startY);
    }
    return smooth(scores);
  };

  const pick = (scores: Float32Array, from: number, to: number, fallback: number) => {
    const start = clamp(Math.round(scores.length * from), 1, scores.length - 2);
    const end = clamp(Math.round(scores.length * to), start + 1, scores.length - 2);
    let best = start;
    let bestScore = -1;
    let total = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const score = scores[i];
      total += score;
      count += 1;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    const average = total / Math.max(1, count);
    return {
      value: clamp(best / Math.max(1, scores.length - 1), 0.02, 0.98),
      strength: bestScore / Math.max(1, average),
      fallback,
    };
  };

  const q = SURFACES[surface].quad;
  const rows = rowScores();
  const wallLike = surface === "wall" || surface === "backsplash" || surface === "shower";
  if (wallLike) {
    const topRange: Record<SurfaceId, [number, number]> = {
      pool: [0.25, 0.55],
      wall: [0.08, 0.45],
      backsplash: [0.2, 0.5],
      shower: [0.08, 0.38],
      floor: [0.35, 0.65],
    };
    const bottomRange: Record<SurfaceId, [number, number]> = {
      pool: [0.65, 0.95],
      wall: [0.5, 0.92],
      backsplash: [0.52, 0.78],
      shower: [0.62, 0.94],
      floor: [0.7, 0.98],
    };
    const top = pick(rows, topRange[surface][0], topRange[surface][1], q[0].y);
    const bottom = pick(rows, bottomRange[surface][0], bottomRange[surface][1], q[2].y);
    const y0 = Math.min(top.value, bottom.value - 0.22);
    const y1 = Math.max(bottom.value, y0 + 0.24);
    const cols = columnScores(clamp(y0 - 0.04, 0.02, 0.9), clamp(y1 + 0.04, 0.1, 0.98));
    const left = pick(cols, 0.04, 0.48, q[0].x);
    const right = pick(cols, 0.52, 0.96, q[1].x);
    const x0 = Math.min(left.value, right.value - 0.26);
    const x1 = Math.max(right.value, x0 + 0.28);
    const confidence = (top.strength + bottom.strength + left.strength + right.strength) / 4;
    if (confidence < 1.12 || x1 - x0 < 0.24 || y1 - y0 < 0.2) return null;
    return {
      quad: [
        { x: clamp(x0, 0.02, 0.92), y: clamp(y0, 0.02, 0.9) },
        { x: clamp(x1, 0.08, 0.98), y: clamp(y0, 0.02, 0.9) },
        { x: clamp(x1, 0.08, 0.98), y: clamp(y1, 0.1, 0.98) },
        { x: clamp(x0, 0.02, 0.92), y: clamp(y1, 0.1, 0.98) },
      ],
      confidence,
    };
  }

  const top = pick(rows, surface === "pool" ? 0.28 : 0.36, surface === "pool" ? 0.68 : 0.72, q[0].y);
  const bottom = pick(rows, 0.72, 0.98, q[2].y);
  const yTop = clamp(top.value, 0.16, 0.82);
  const yBottom = clamp(Math.max(bottom.value, yTop + 0.18), yTop + 0.18, 0.98);
  const topCols = columnScores(clamp(yTop - 0.1, 0.04, 0.86), clamp(yTop + 0.14, 0.12, 0.94));
  const lowerCols = columnScores(clamp(yTop, 0.08, 0.9), 0.98);
  const leftTop = pick(topCols, 0.04, 0.48, q[0].x);
  const rightTop = pick(topCols, 0.52, 0.96, q[1].x);
  const leftBottom = pick(lowerCols, 0.0, 0.42, q[3].x);
  const rightBottom = pick(lowerCols, 0.58, 1.0, q[2].x);
  const confidence = (top.strength + bottom.strength + leftTop.strength + rightTop.strength + leftBottom.strength + rightBottom.strength) / 6;
  const topWidth = rightTop.value - leftTop.value;
  const bottomWidth = rightBottom.value - leftBottom.value;
  if (confidence < 1.1 || topWidth < 0.22 || bottomWidth < 0.28 || yBottom - yTop < 0.16) return null;
  return {
    quad: [
      { x: clamp(leftTop.value, 0.02, 0.74), y: yTop },
      { x: clamp(rightTop.value, 0.26, 0.98), y: yTop },
      { x: clamp(Math.max(rightBottom.value, rightTop.value + 0.08), 0.34, 0.98), y: yBottom },
      { x: clamp(Math.min(leftBottom.value, leftTop.value - 0.08), 0.02, 0.66), y: yBottom },
    ],
    confidence,
  };
}

function detectSurfaceQuad(image: HTMLImageElement, surface: SurfaceId): SnapResult | null {
  return detectSurfaceFrame(image, image.naturalWidth || image.width, image.naturalHeight || image.height, surface);
}

export { detectSurfaceFrame, detectSurfaceQuad };
