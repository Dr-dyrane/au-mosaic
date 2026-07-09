import type { Pt } from "./types";
import { simplifyPath } from "./geometry";

/* The magic wand: tap a point on the photo and grow a region of
   colour-alike pixels out from it, then hand back its outline as a
   normalised polygon the surface tools already understand. No model,
   no network, no dependency; a classic region grow that runs in the
   browser on the untouched photo. It answers "find the surface" for a
   plain wall or floor, and the hand tools refine whatever it misses. */

/* Grow a mask out from the seed over four-connected pixels whose colour
   sits within tolerance of the seed colour. Tolerance is a per-channel
   distance; the test is on the squared sum so there is no square root in
   the loop. Returns one byte per pixel, 1 inside the region. */
export function floodSelect(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  seedX: number,
  seedY: number,
  tolerance: number
): Uint8Array {
  const mask = new Uint8Array(w * h);
  if (w <= 0 || h <= 0) return mask;
  const sx = Math.max(0, Math.min(w - 1, Math.round(seedX)));
  const sy = Math.max(0, Math.min(h - 1, Math.round(seedY)));
  const seed = (sy * w + sx) * 4;
  const r0 = data[seed];
  const g0 = data[seed + 1];
  const b0 = data[seed + 2];
  const limit = tolerance * tolerance * 3;

  const stack = new Int32Array(w * h);
  let top = 0;
  const start = sy * w + sx;
  mask[start] = 1;
  stack[top++] = start;

  while (top > 0) {
    const idx = stack[--top];
    const x = idx % w;
    const y = (idx - x) / w;
    const neighbours = [
      x > 0 ? idx - 1 : -1,
      x < w - 1 ? idx + 1 : -1,
      y > 0 ? idx - w : -1,
      y < h - 1 ? idx + w : -1,
    ];
    for (const n of neighbours) {
      if (n < 0 || mask[n]) continue;
      const p = n * 4;
      const dr = data[p] - r0;
      const dg = data[p + 1] - g0;
      const db = data[p + 2] - b0;
      if (dr * dr + dg * dg + db * db <= limit) {
        mask[n] = 1;
        stack[top++] = n;
      }
    }
  }
  return mask;
}

/* How much of the frame the region covers, 0 to 1. The stage uses it to
   refuse a tap that grabbed almost nothing or almost everything, and to
   nudge the tolerance instead. */
export function maskCoverage(mask: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) count += 1;
  return mask.length ? count / mask.length : 0;
}

/* Follow the outer boundary of the region with Moore-neighbour tracing,
   starting at the first set pixel found top to bottom, left to right.
   Returns pixel points around the edge; holes are ignored, which is
   what a surface outline wants. */
export function traceMaskOutline(mask: Uint8Array, w: number, h: number): Pt[] {
  let start = -1;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];

  const sx = start % w;
  const sy = (start - sx) / w;
  const isFg = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;

  /* Eight neighbours clockwise for screen coordinates (y grows down):
     east, south-east, south, south-west, west, north-west, north,
     north-east. */
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const pts: Pt[] = [];
  /* The start is the top-left-most set pixel, so we entered it from the
     west; that background pixel is the first backtrack. */
  let bx = sx - 1;
  let by = sy;
  let cx = sx;
  let cy = sy;
  const maxSteps = mask.length * 4;
  let steps = 0;

  while (steps < maxSteps) {
    pts.push({ x: cx, y: cy });
    /* Direction index from the current pixel to its backtrack. */
    let bd = 4;
    for (let d = 0; d < 8; d += 1) {
      if (cx + dirs[d][0] === bx && cy + dirs[d][1] === by) {
        bd = d;
        break;
      }
    }
    /* Sweep clockwise from just past the backtrack for the next edge
       pixel; the background cell examined right before it becomes the
       new backtrack. */
    let found = false;
    for (let k = 1; k <= 8; k += 1) {
      const d = (bd + k) % 8;
      const nx = cx + dirs[d][0];
      const ny = cy + dirs[d][1];
      if (isFg(nx, ny)) {
        const pd = (bd + k - 1) % 8;
        bx = cx + dirs[pd][0];
        by = cy + dirs[pd][1];
        cx = nx;
        cy = ny;
        found = true;
        break;
      }
    }
    if (!found) break;
    steps += 1;
    if (cx === sx && cy === sy) break;
  }

  return pts;
}

/* The whole move: a grown mask to a light, normalised polygon the
   surface tools consume. Empty or degenerate selections come back
   empty so the caller can fall back to the hand. */
export function maskToPolygon(
  mask: Uint8Array,
  w: number,
  h: number,
  epsilon = 0.006
): Pt[] {
  const outline = traceMaskOutline(mask, w, h);
  if (outline.length < 3 || w <= 0 || h <= 0) return [];
  const normalised = outline.map((p) => ({ x: p.x / w, y: p.y / h }));
  const simplified = simplifyPath(normalised, epsilon);
  return simplified.length >= 3 ? simplified : [];
}
