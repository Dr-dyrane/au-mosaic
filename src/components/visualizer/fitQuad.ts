import type { Pt } from "./types";
import { clamp, isValidQuad, pointInQuad } from "./geometry";
import type { BinaryMask } from "./fitMask";

/* The quad stages of the fit engine: turn a traced outline into four
   honest corners. Hough lines first, the smallest rectangle second, the
   extreme corners last; fit.ts runs the ladder. */

/* A fitted quad earns its keep only if the contour actually hugs its
   edges: at least this fraction of contour points within the pixel
   tolerance below. */
const COVERAGE_FLOOR = 0.75;
const COVERAGE_TOLERANCE_PX = 3;

/* Corners stay a little inside the frame, matching the app's habit. */
const EDGE_INSET = 0.02;

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
export function orderCorners(corners: Pt[], centre: Pt): Pt[] {
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
