import type { Pt } from "./types";
import { clamp, isValidQuad, pointInQuad, quadArea } from "./geometry";

/* The mask-to-plane engine. The segment model hands back a binary mask;
   this module decides whether that outline is one clean plane worth four
   fitted corners, or a shape the mask should cut on its own. Pure math on
   a Uint8Array, no DOM, so the node tests can drive every stage. */

export type BinaryMask = { data: Uint8Array; width: number; height: number };

export type FitResult =
  | { kind: "quad"; quad: Pt[]; confidence: number }
  | { kind: "clip" };

/* Walls face the camera, so their outline is their plane and the Hough
   ladder earns its keep. Floors recede: the outline is whatever the room
   happens to clip, not the plane itself. */
export type SurfaceKind = "wall" | "floor";

/* Below this ratio of component area to convex-hull area the outline is
   not one plane in silhouette: furniture bites into a floor, an L-room
   turns a corner. Four corners forced onto such a mask would lie about
   the perspective, so the mask clips instead. */
const SOLIDITY_FLOOR = 0.8;

/* A fitted quad earns its keep only if the contour actually hugs its
   edges: at least this fraction of contour points within the pixel
   tolerance below. */
const COVERAGE_FLOOR = 0.75;
const COVERAGE_TOLERANCE_PX = 3;

/* Corners stay a little inside the frame, matching the app's habit. */
const EDGE_INSET = 0.02;

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

type HoughLine = { theta: number; rho: number; votes: number };

/* Standard Hough transform over the contour: theta in one-degree steps,
   rho at one pixel. Peaks come out strongest first, each suppressing its
   neighbourhood, wrapping theta across the ends where the same line
   reappears with its rho negated. */
export function houghLines(contour: Pt[], width: number, height: number, maxLines: number): HoughLine[] {
  const thetaSteps = 180;
  const cos = new Float64Array(thetaSteps);
  const sin = new Float64Array(thetaSteps);
  for (let t = 0; t < thetaSteps; t += 1) {
    const rad = (t * Math.PI) / 180;
    cos[t] = Math.cos(rad);
    sin[t] = Math.sin(rad);
  }
  const maxRho = Math.ceil(Math.hypot(width, height));
  const rhoSteps = 2 * maxRho + 1;
  const acc = new Int32Array(thetaSteps * rhoSteps);
  for (const p of contour) {
    for (let t = 0; t < thetaSteps; t += 1) {
      const r = Math.round(p.x * cos[t] + p.y * sin[t]) + maxRho;
      acc[t * rhoSteps + r] += 1;
    }
  }
  const minVotes = Math.max(8, Math.round(contour.length * 0.05));
  const lines: HoughLine[] = [];
  while (lines.length < maxLines) {
    let best = -1;
    let bestVotes = minVotes - 1;
    for (let i = 0; i < acc.length; i += 1) {
      if (acc[i] > bestVotes) {
        bestVotes = acc[i];
        best = i;
      }
    }
    if (best < 0) break;
    const t = Math.floor(best / rhoSteps);
    const r = best - t * rhoSteps;
    lines.push({ theta: (t * Math.PI) / 180, rho: r - maxRho, votes: bestVotes });
    for (let dt = -5; dt <= 5; dt += 1) {
      let tt = t + dt;
      let centre = r;
      if (tt < 0) {
        tt += thetaSteps;
        centre = 2 * maxRho - r;
      } else if (tt >= thetaSteps) {
        tt -= thetaSteps;
        centre = 2 * maxRho - r;
      }
      for (let dr = -10; dr <= 10; dr += 1) {
        const rr = centre + dr;
        if (rr >= 0 && rr < rhoSteps) acc[tt * rhoSteps + rr] = 0;
      }
    }
  }
  return lines;
}

function intersectLines(a: HoughLine, b: HoughLine): Pt | null {
  const det = Math.cos(a.theta) * Math.sin(b.theta) - Math.sin(a.theta) * Math.cos(b.theta);
  if (Math.abs(det) < 1e-6) return null;
  return {
    x: (a.rho * Math.sin(b.theta) - b.rho * Math.sin(a.theta)) / det,
    y: (Math.cos(a.theta) * b.rho - Math.cos(b.theta) * a.rho) / det,
  };
}

function circularThetaDist(a: number, b: number): number {
  const d = Math.abs(a - b) % Math.PI;
  return Math.min(d, Math.PI - d);
}

/* Sorting by angle around the centroid puts the corners in the app's
   order: tl, tr, br, bl, clockwise on screen. */
function orderCorners(corners: Pt[], centre: Pt): Pt[] {
  return [...corners].sort(
    (a, b) => Math.atan2(a.y - centre.y, a.x - centre.x) - Math.atan2(b.y - centre.y, b.x - centre.x),
  );
}

export function normalizeQuad(quad: Pt[], width: number, height: number): Pt[] {
  return quad.map((p) => ({
    x: clamp(p.x / width, EDGE_INSET, 1 - EDGE_INSET),
    y: clamp(p.y / height, EDGE_INSET, 1 - EDGE_INSET),
  }));
}

/* Fraction of contour points sitting within tolerance of one of the four
   edge lines. This is both the validation gate and the confidence. */
export function contourCoverage(contour: Pt[], quad: Pt[]): number {
  if (!contour.length) return 0;
  const edges: { nx: number; ny: number; r: number }[] = [];
  for (let i = 0; i < 4; i += 1) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-9) return 0;
    const nx = (a.y - b.y) / len;
    const ny = (b.x - a.x) / len;
    edges.push({ nx, ny, r: nx * a.x + ny * a.y });
  }
  let hits = 0;
  for (const p of contour) {
    for (const e of edges) {
      if (Math.abs(e.nx * p.x + e.ny * p.y - e.r) <= COVERAGE_TOLERANCE_PX) {
        hits += 1;
        break;
      }
    }
  }
  return hits / contour.length;
}

/* Turn four Hough lines into a corner quad. The lines pair up into the
   two most parallel opposite pairs, each corner crossing one line from
   each pair; the quad must stay near the frame, be convex, and hold the
   component centroid. */
function quadFromLines(four: HoughLine[], centroid: Pt, width: number, height: number): Pt[] | null {
  const pairings: [number, number][][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];
  let bestPairing = pairings[0];
  let bestScore = Infinity;
  for (const pairing of pairings) {
    const score =
      circularThetaDist(four[pairing[0][0]].theta, four[pairing[0][1]].theta) +
      circularThetaDist(four[pairing[1][0]].theta, four[pairing[1][1]].theta);
    if (score < bestScore) {
      bestScore = score;
      bestPairing = pairing;
    }
  }
  const a1 = four[bestPairing[0][0]];
  const a2 = four[bestPairing[0][1]];
  const b1 = four[bestPairing[1][0]];
  const b2 = four[bestPairing[1][1]];
  const raw = [intersectLines(a1, b1), intersectLines(a1, b2), intersectLines(a2, b2), intersectLines(a2, b1)];
  const marginX = width * 0.35;
  const marginY = height * 0.35;
  const pts: Pt[] = [];
  for (const c of raw) {
    if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y)) return null;
    if (c.x < -marginX || c.x > width + marginX || c.y < -marginY || c.y > height + marginY) return null;
    pts.push(c);
  }
  const ordered = orderCorners(pts, centroid);
  if (!pointInQuad(centroid, ordered)) return null;
  if (!isValidQuad(normalizeQuad(ordered, width, height))) return null;
  return ordered;
}

/* First attempt: up to six Hough peaks, every four-line combination, and
   the best-covered convex quad wins. */
export function houghQuadFit(contour: Pt[], mask: BinaryMask, centroid: Pt): { quad: Pt[]; confidence: number } | null {
  const lines = houghLines(contour, mask.width, mask.height, 6);
  if (lines.length < 4) return null;
  let best: { quad: Pt[]; confidence: number } | null = null;
  for (let a = 0; a < lines.length; a += 1) {
    for (let b = a + 1; b < lines.length; b += 1) {
      for (let c = b + 1; c < lines.length; c += 1) {
        for (let d = c + 1; d < lines.length; d += 1) {
          const quad = quadFromLines([lines[a], lines[b], lines[c], lines[d]], centroid, mask.width, mask.height);
          if (!quad) continue;
          const cover = contourCoverage(contour, quad);
          if (cover < COVERAGE_FLOOR) continue;
          if (!best || cover > best.confidence) best = { quad, confidence: cover };
        }
      }
    }
  }
  return best;
}

/* Second attempt: rotating calipers over the hull, the smallest rectangle
   that holds the shape. */
export function minAreaRect(hull: Pt[]): Pt[] | null {
  if (hull.length < 3) return null;
  let best: { area: number; corners: Pt[] } | null = null;
  for (let i = 0; i < hull.length; i += 1) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-9) continue;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const vx = -uy;
    const vy = ux;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const p of hull) {
      const pu = p.x * ux + p.y * uy;
      const pv = p.x * vx + p.y * vy;
      if (pu < minU) minU = pu;
      if (pu > maxU) maxU = pu;
      if (pv < minV) minV = pv;
      if (pv > maxV) maxV = pv;
    }
    const area = (maxU - minU) * (maxV - minV);
    if (!best || area < best.area) {
      best = {
        area,
        corners: [
          { x: minU * ux + minV * vx, y: minU * uy + minV * vy },
          { x: maxU * ux + minV * vx, y: maxU * uy + minV * vy },
          { x: maxU * ux + maxV * vx, y: maxU * uy + maxV * vy },
          { x: minU * ux + maxV * vx, y: minU * uy + maxV * vy },
        ],
      };
    }
  }
  return best ? best.corners : null;
}

/* Last resort: the extreme-corners scan the app shipped with, min and max
   of x plus y and x minus y. It keeps today's pool-basin behaviour as the
   floor of quality. */
export function extremeCorners(mask: BinaryMask): Pt[] | null {
  const { data, width, height } = mask;
  let tl = { x: 0, y: 0 };
  let tr = { x: 0, y: 0 };
  let br = { x: 0, y: 0 };
  let bl = { x: 0, y: 0 };
  let tlV = Infinity;
  let brV = -Infinity;
  let trV = -Infinity;
  let blV = Infinity;
  let found = false;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!data[y * width + x]) continue;
      found = true;
      const s = x + y;
      const d = x - y;
      if (s < tlV) { tlV = s; tl = { x, y }; }
      if (s > brV) { brV = s; br = { x, y }; }
      if (d > trV) { trV = d; tr = { x, y }; }
      if (d < blV) { blV = d; bl = { x, y }; }
    }
  }
  return found ? [tl, tr, br, bl] : null;
}

function maskCentroid(mask: BinaryMask): Pt {
  const { data, width, height } = mask;
  let sx = 0;
  let sy = 0;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!data[y * width + x]) continue;
      sx += x;
      sy += y;
      count += 1;
    }
  }
  return count ? { x: sx / count + 0.5, y: sy / count + 0.5 } : { x: width / 2, y: height / 2 };
}

/* The whole pipeline: isolate the biggest component, clean and fill it,
   gate on solidity, then fit the outline: Hough first, the smallest
   rectangle second, the extreme corners last. Anything that cannot carry
   four honest corners says clip and lets the mask do the cutting. */
export function fitMask(mask: BinaryMask, kind: SurfaceKind = "wall"): FitResult {
  const component = largestComponent(mask);
  if (!component) return { kind: "clip" };
  const filled = fillHoles(morphClose(morphOpen(component)));
  /* Opening can split a thin shape; keep the surviving majority. */
  const cleaned = largestComponent(filled);
  if (!cleaned) return { kind: "clip" };
  const contour = traceBoundary(cleaned);
  if (contour.length < 8) return { kind: "clip" };
  if (solidity(cleaned) < SOLIDITY_FLOOR) return { kind: "clip" };
  const centroid = maskCentroid(cleaned);

  /* A floor's outline is not its plane. Hough would trace the basin's
     honest silhouette and lay the courses diagonally; the quad here is
     only a perspective basis, the mask clips the exact shape. So floors
     take the extreme corners straight away, a level receding trapezoid. */
  if (kind === "floor") {
    const extremes = extremeCorners(cleaned);
    if (extremes) {
      const quad = normalizeQuad(extremes, cleaned.width, cleaned.height);
      if (isValidQuad(quad)) {
        return { kind: "quad", quad, confidence: contourCoverage(contour, extremes) };
      }
    }
    return { kind: "clip" };
  }

  const hough = houghQuadFit(contour, cleaned, centroid);
  if (hough) {
    return {
      kind: "quad",
      quad: normalizeQuad(hough.quad, cleaned.width, cleaned.height),
      confidence: hough.confidence,
    };
  }

  const rect = minAreaRect(convexHull(contour));
  if (rect) {
    const ordered = orderCorners(rect, centroid);
    const quad = normalizeQuad(ordered, cleaned.width, cleaned.height);
    if (isValidQuad(quad)) {
      return { kind: "quad", quad, confidence: contourCoverage(contour, ordered) };
    }
  }

  const extremes = extremeCorners(cleaned);
  if (extremes) {
    const quad = normalizeQuad(extremes, cleaned.width, cleaned.height);
    if (isValidQuad(quad)) {
      return { kind: "quad", quad, confidence: contourCoverage(contour, extremes) };
    }
  }

  return { kind: "clip" };
}
