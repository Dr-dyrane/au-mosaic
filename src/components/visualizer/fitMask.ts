import type { Pt } from "./types";
import { quadArea } from "./geometry";

/* The binary mask stages of the fit engine: isolate the component, clean
   and fill it, trace and measure its outline. Pure math on a Uint8Array,
   no DOM. fit.ts composes these and keeps the public surface. */

export type BinaryMask = { data: Uint8Array; width: number; height: number };

/* Below this ratio of component area to convex-hull area the outline is
   not one plane in silhouette: furniture bites into a floor, an L-room
   turns a corner. Four corners forced onto such a mask would lie about
   the perspective, so the mask clips instead. */
export const SOLIDITY_FLOOR = 0.8;

export function largestComponent(mask: BinaryMask): BinaryMask | null {
  const { data, width, height } = mask;
  const total = width * height;
  const labels = new Int32Array(total);
  const queue = new Int32Array(total);
  let bestLabel = 0;
  let bestSize = 0;
  let label = 0;
  for (let i = 0; i < total; i += 1) {
    if (!data[i] || labels[i]) continue;
    label += 1;
    labels[i] = label;
    queue[0] = i;
    let head = 0;
    let tail = 1;
    while (head < tail) {
      const p = queue[head];
      head += 1;
      const x = p % width;
      const y = (p - x) / width;
      if (x > 0 && data[p - 1] && !labels[p - 1]) { labels[p - 1] = label; queue[tail] = p - 1; tail += 1; }
      if (x < width - 1 && data[p + 1] && !labels[p + 1]) { labels[p + 1] = label; queue[tail] = p + 1; tail += 1; }
      if (y > 0 && data[p - width] && !labels[p - width]) { labels[p - width] = label; queue[tail] = p - width; tail += 1; }
      if (y < height - 1 && data[p + width] && !labels[p + width]) { labels[p + width] = label; queue[tail] = p + width; tail += 1; }
    }
    if (tail > bestSize) { bestSize = tail; bestLabel = label; }
  }
  if (!bestLabel) return null;
  const out = new Uint8Array(total);
  for (let i = 0; i < total; i += 1) if (labels[i] === bestLabel) out[i] = 1;
  return { data: out, width, height };
}

/* One 3x3 pass. Erode keeps a pixel only when the whole neighbourhood is
   surface; dilate keeps it when any of it is. Outside the frame counts as
   empty. */
function morphPass(mask: BinaryMask, erode: boolean): BinaryMask {
  const { data, width, height } = mask;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let all = true;
      let any = false;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          const v = nx >= 0 && nx < width && ny >= 0 && ny < height ? data[ny * width + nx] : 0;
          if (v) any = true;
          else all = false;
        }
      }
      out[y * width + x] = erode ? (all ? 1 : 0) : any ? 1 : 0;
    }
  }
  return { data: out, width, height };
}

export function morphOpen(mask: BinaryMask): BinaryMask {
  return morphPass(morphPass(mask, true), false);
}

export function morphClose(mask: BinaryMask): BinaryMask {
  return morphPass(morphPass(mask, false), true);
}

/* Flood the empty space from the border; any emptiness the flood never
   reaches is a hole inside the surface (a window in a wall, a rug on a
   floor) and becomes surface, so the outline fit sees one solid shape. */
export function fillHoles(mask: BinaryMask): BinaryMask {
  const { data, width, height } = mask;
  const total = width * height;
  const reached = new Uint8Array(total);
  const queue = new Int32Array(total);
  let tail = 0;
  const seed = (i: number) => {
    if (!data[i] && !reached[i]) {
      reached[i] = 1;
      queue[tail] = i;
      tail += 1;
    }
  };
  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  let head = 0;
  while (head < tail) {
    const p = queue[head];
    head += 1;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) seed(p - 1);
    if (x < width - 1) seed(p + 1);
    if (y > 0) seed(p - width);
    if (y < height - 1) seed(p + width);
  }
  const out = new Uint8Array(total);
  for (let i = 0; i < total; i += 1) out[i] = data[i] || !reached[i] ? 1 : 0;
  return { data: out, width, height };
}

/* Moore neighbours, clockwise from east. */
const TRACE_DIRS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
] as const;

/* Moore-neighbour boundary trace of the single component, an ordered walk
   around its outline. The scan finds the top-left surface pixel, so the
   first look is northwest of it; the trace ends when it leaves the start
   pixel the same way twice. */
export function traceBoundary(mask: BinaryMask): Pt[] {
  const { data, width, height } = mask;
  let start = -1;
  for (let i = 0; i < width * height; i += 1) {
    if (data[i]) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];
  const sx = start % width;
  const sy = (start - sx) / width;
  const contour: Pt[] = [{ x: sx, y: sy }];
  let px = sx;
  let py = sy;
  let dir = 5;
  let firstMove = -1;
  const cap = 4 * width * height;
  for (let step = 0; step < cap; step += 1) {
    let found = -1;
    for (let i = 0; i < 8; i += 1) {
      const nd = (dir + i) % 8;
      const nx = px + TRACE_DIRS[nd][0];
      const ny = py + TRACE_DIRS[nd][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && data[ny * width + nx]) {
        found = nd;
        break;
      }
    }
    if (found < 0) break;
    if (px === sx && py === sy) {
      if (firstMove < 0) firstMove = found;
      else if (found === firstMove) break;
    }
    px += TRACE_DIRS[found][0];
    py += TRACE_DIRS[found][1];
    contour.push({ x: px, y: py });
    dir = (found + 6) % 8;
  }
  const last = contour[contour.length - 1];
  if (contour.length > 1 && last.x === sx && last.y === sy) contour.pop();
  return contour;
}

/* Andrew monotone chain. */
export function convexHull(points: Pt[]): Pt[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const uniq: Pt[] = [];
  for (const p of sorted) {
    const prev = uniq[uniq.length - 1];
    if (!prev || prev.x !== p.x || prev.y !== p.y) uniq.push(p);
  }
  if (uniq.length <= 2) return uniq;
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = uniq.length - 1; i >= 0; i -= 1) {
    const p = uniq[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/* Component area over convex-hull area. Pixels count as unit squares and
   the hull runs through their outer corners, so a full rectangle scores
   exactly one. */
export function solidity(mask: BinaryMask): number {
  const { data, width, height } = mask;
  let count = 0;
  const corners: Pt[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!data[y * width + x]) continue;
      count += 1;
      const onBoundary =
        x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
        !data[y * width + x - 1] || !data[y * width + x + 1] ||
        !data[(y - 1) * width + x] || !data[(y + 1) * width + x];
      if (onBoundary) {
        corners.push({ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 });
      }
    }
  }
  if (!count) return 0;
  const area = quadArea(convexHull(corners));
  return area > 0 ? count / area : 0;
}
