import type { Pt } from "./types";
import type { BinaryMask } from "./fitMask";
import { isValidQuad, pointInQuad, quadArea } from "./geometry";
import { contourCoverage, houghLines, normalizeQuad, orderCorners } from "./fitQuad";

/* The shell's second eye. Once a pool wears its shell, the photo itself
   can place the basin floor: the creases where the walls meet the bottom
   are the strongest lines inside the rim. Pure math on arrays, no DOM,
   so the node tests drive every stage. Null is a first-class answer:
   nothing convincing means the caller keeps the floor it has. */

/* Four one-pixel passes keep the rim's own edges out of the search. */
const SHELL_ERODE_PX = 4;

/* Sobel L1 magnitudes below this are texture, not crease; a flat photo
   must answer with nothing rather than noise. */
const CREASE_MAG_FLOOR = 80;

/* Above that floor, only the strongest few percent of in-mask gradients
   count as crease. */
const CREASE_KEEP = 0.06;

/* Fewer points than this cannot vote four honest lines. */
const MIN_CREASE_POINTS = 24;

const MAX_CREASE_LINES = 6;

/* A believable basin floor sits well inside the rim: neither a puddle
   nor the rim itself. Ratios of floor area to rim area. */
const FLOOR_AREA_MIN = 0.1;
const FLOOR_AREA_MAX = 0.8;

/* The winning floor must explain at least half the crease points. */
const SHELL_CONFIDENCE_FLOOR = 0.5;

type CreaseLine = { theta: number; rho: number };

/* One pixel per pass, the outside of the frame counting as empty, so the
   erosion pulls the mask's own boundary out of the crease search. */
export function erodeMask(mask: BinaryMask, passes = SHELL_ERODE_PX): BinaryMask {
  let current = mask;
  for (let pass = 0; pass < passes; pass += 1) {
    const { data, width, height } = current;
    const out = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = y * width + x;
        if (
          data[i] &&
          data[i - 1] && data[i + 1] &&
          data[i - width - 1] && data[i - width] && data[i - width + 1] &&
          data[i + width - 1] && data[i + width] && data[i + width + 1]
        ) {
          out[i] = 1;
        }
      }
    }
    current = { data: out, width, height };
  }
  return current;
}

/* Sobel over the luma, sampled only where the eroded mask is set. The
   threshold adapts: the strongest few percent of in-mask gradients pass,
   but never anything under the absolute floor, so a featureless photo
   answers with an empty list instead of noise. */
export function creaseEdges(eroded: BinaryMask, luma: Uint8Array): Pt[] {
  const { data, width, height } = eroded;
  const xs: number[] = [];
  const ys: number[] = [];
  const mags: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      if (!data[i]) continue;
      const gx =
        luma[i - width + 1] + 2 * luma[i + 1] + luma[i + width + 1] -
        luma[i - width - 1] - 2 * luma[i - 1] - luma[i + width - 1];
      const gy =
        luma[i + width - 1] + 2 * luma[i + width] + luma[i + width + 1] -
        luma[i - width - 1] - 2 * luma[i - width] - luma[i - width + 1];
      xs.push(x);
      ys.push(y);
      mags.push(Math.abs(gx) + Math.abs(gy));
    }
  }
  if (!mags.length) return [];
  const sorted = [...mags].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.floor(sorted.length * (1 - CREASE_KEEP)));
  const cut = Math.max(CREASE_MAG_FLOOR, sorted[rank]);
  const out: Pt[] = [];
  for (let k = 0; k < mags.length; k += 1) {
    if (mags[k] >= cut) out.push({ x: xs[k], y: ys[k] });
  }
  return out;
}

/* The same Hough machinery the rim fit trusts, pointed at the crease
   points instead of a contour. Up to six deduped peaks. */
export function creaseLines(edges: Pt[], width: number, height: number): CreaseLine[] {
  return houghLines(edges, width, height, MAX_CREASE_LINES);
}

function intersect(a: CreaseLine, b: CreaseLine): Pt | null {
  const det = Math.cos(a.theta) * Math.sin(b.theta) - Math.sin(a.theta) * Math.cos(b.theta);
  if (Math.abs(det) < 1e-6) return null;
  return {
    x: (a.rho * Math.sin(b.theta) - b.rho * Math.sin(a.theta)) / det,
    y: (Math.cos(a.theta) * b.rho - Math.cos(b.theta) * a.rho) / det,
  };
}

function thetaDist(a: number, b: number): number {
  const d = Math.abs(a - b) % Math.PI;
  return Math.min(d, Math.PI - d);
}

/* fitQuad's own builder gates by frame margins and the mask centroid;
   the floor answers to the rim instead, so this stays its own small
   builder: pair the four lines into the two most parallel opposite
   pairs, cross them, and order the corners tl, tr, br, bl. */
function quadFromCreases(four: CreaseLine[]): Pt[] | null {
  const pairings: [number, number][][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];
  let bestPairing = pairings[0];
  let bestScore = Infinity;
  for (const pairing of pairings) {
    const score =
      thetaDist(four[pairing[0][0]].theta, four[pairing[0][1]].theta) +
      thetaDist(four[pairing[1][0]].theta, four[pairing[1][1]].theta);
    if (score < bestScore) {
      bestScore = score;
      bestPairing = pairing;
    }
  }
  const a1 = four[bestPairing[0][0]];
  const a2 = four[bestPairing[0][1]];
  const b1 = four[bestPairing[1][0]];
  const b2 = four[bestPairing[1][1]];
  const raw = [intersect(a1, b1), intersect(a1, b2), intersect(a2, b2), intersect(a2, b1)];
  const pts: Pt[] = [];
  for (const c of raw) {
    if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y)) return null;
    pts.push(c);
  }
  const centre = {
    x: (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4,
    y: (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4,
  };
  return orderCorners(pts, centre);
}

/* Every four-line combination becomes a candidate; one survives only
   with all four corners strictly inside the rim, a convex valid quad,
   and an area neither a puddle nor the rim itself. Crease coverage
   scores the survivors, and the best must clear the confidence floor. */
export function floorQuad(
  lines: CreaseLine[],
  edges: Pt[],
  rim: Pt[],
  width: number,
  height: number,
): { quad: Pt[]; confidence: number } | null {
  const rimArea = quadArea(rim);
  if (!rimArea) return null;
  let best: { quad: Pt[]; confidence: number } | null = null;
  for (let a = 0; a < lines.length; a += 1) {
    for (let b = a + 1; b < lines.length; b += 1) {
      for (let c = b + 1; c < lines.length; c += 1) {
        for (let d = c + 1; d < lines.length; d += 1) {
          const quad = quadFromCreases([lines[a], lines[b], lines[c], lines[d]]);
          if (!quad) continue;
          if (!quad.every((p) => pointInQuad(p, rim))) continue;
          const ratio = quadArea(quad) / rimArea;
          if (ratio < FLOOR_AREA_MIN || ratio > FLOOR_AREA_MAX) continue;
          if (!isValidQuad(normalizeQuad(quad, width, height))) continue;
          const cover = contourCoverage(edges, quad);
          if (cover < SHELL_CONFIDENCE_FLOOR) continue;
          if (!best || cover > best.confidence) best = { quad, confidence: cover };
        }
      }
    }
  }
  return best;
}

/* The whole pipeline. Mask, luma, and rim share one pixel space; the
   answer comes back normalised 0..1 and clamped onto the stage, or null
   when the photo does not argue for a floor. */
export function deriveShellFloor(mask: BinaryMask, luma: Uint8Array, rim: Pt[]): Pt[] | null {
  if (luma.length !== mask.width * mask.height) return null;
  const eroded = erodeMask(mask);
  const edges = creaseEdges(eroded, luma);
  if (edges.length < MIN_CREASE_POINTS) return null;
  const lines = creaseLines(edges, mask.width, mask.height);
  if (lines.length < 4) return null;
  const best = floorQuad(lines, edges, rim, mask.width, mask.height);
  if (!best) return null;
  return normalizeQuad(best.quad, mask.width, mask.height);
}

/* A floor's own mask gives a clean receding trapezoid without any crease
   guess: read the mask's left and right extent at its far (top) edge and
   its near (bottom) edge, and join the four. A single tip row is noise,
   so the far and near edges are read a short way in from the extremes and
   each extent is the median of a small band of rows. Convex by
   construction (two horizontal edges, sides between), so the tile
   homography never fans. Null when the mask is too thin or too short to
   trust; the caller keeps the geometric floor. Corner order is the app's
   own tl, tr, br, bl, returned normalised 0..1. */
export function floorTrapezoidFromMask(mask: BinaryMask): Pt[] | null {
  const { data, width, height } = mask;
  const minRun = Math.max(3, Math.round(width * 0.04));
  const rows: number[] = [];
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    for (let x = 0; x < width; x += 1) if (data[y * width + x]) count += 1;
    if (count >= minRun) rows.push(y);
  }
  if (rows.length < Math.max(6, Math.round(height * 0.05))) return null;
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  if (bottom - top < height * 0.06) return null;

  /* Read each edge a short inset in from the tip, and take the widest
     band row so a ragged single scanline cannot pinch the trapezoid. */
  const inset = Math.max(1, Math.round((bottom - top) * 0.06));
  const extentOf = (y: number): [number, number] | null => {
    let l = -1;
    let r = -1;
    for (let x = 0; x < width; x += 1) {
      if (data[y * width + x]) {
        if (l < 0) l = x;
        r = x;
      }
    }
    return l < 0 ? null : [l, r];
  };
  const widestNear = (center: number): [number, number] | null => {
    let best: [number, number] | null = null;
    for (let y = center - inset; y <= center + inset; y += 1) {
      if (y < 0 || y >= height) continue;
      const e = extentOf(y);
      if (e && (!best || e[1] - e[0] > best[1] - best[0])) best = e;
    }
    return best;
  };
  const far = widestNear(top + inset);
  const near = widestNear(bottom - inset);
  if (!far || !near) return null;
  /* A believable floor is wider near the camera than far; if the mask
     reads the other way the plane is ambiguous, so decline. */
  if (near[1] - near[0] < (far[1] - far[0]) * 0.8) return null;

  const quad: Pt[] = [
    { x: far[0] / width, y: (top + inset) / height },
    { x: far[1] / width, y: (top + inset) / height },
    { x: near[1] / width, y: (bottom - inset) / height },
    { x: near[0] / width, y: (bottom - inset) / height },
  ];
  return isValidQuad(quad) ? quad : null;
}

/* A wall recedes across the frame, so its mask reads as a band whose
   height falls off toward the far end. Transpose the floor read: take the
   mask's top and bottom extent at its left column and its right column,
   and join the four. The result follows the wall's vertical
   foreshortening (tall near, short far) far better than an axis-aligned
   box, which lays flat tiles that streak under the gloss. Null on a mask
   too thin or too short to trust; corner order tl, tr, br, bl. */
export function wallTrapezoidFromMask(mask: BinaryMask): Pt[] | null {
  const { data, width, height } = mask;
  const minRun = Math.max(3, Math.round(height * 0.04));
  const cols: number[] = [];
  for (let x = 0; x < width; x += 1) {
    let count = 0;
    for (let y = 0; y < height; y += 1) if (data[y * width + x]) count += 1;
    if (count >= minRun) cols.push(x);
  }
  if (cols.length < Math.max(6, Math.round(width * 0.05))) return null;
  const left = cols[0];
  const right = cols[cols.length - 1];
  if (right - left < width * 0.06) return null;

  const inset = Math.max(1, Math.round((right - left) * 0.06));
  const extentOf = (x: number): [number, number] | null => {
    let t = -1;
    let b = -1;
    for (let y = 0; y < height; y += 1) {
      if (data[y * width + x]) {
        if (t < 0) t = y;
        b = y;
      }
    }
    return t < 0 ? null : [t, b];
  };
  const tallestNear = (center: number): [number, number] | null => {
    let best: [number, number] | null = null;
    for (let x = center - inset; x <= center + inset; x += 1) {
      if (x < 0 || x >= width) continue;
      const e = extentOf(x);
      if (e && (!best || e[1] - e[0] > best[1] - best[0])) best = e;
    }
    return best;
  };
  const lb = tallestNear(left + inset);
  const rb = tallestNear(right - inset);
  if (!lb || !rb) return null;

  const lx = (left + inset) / width;
  const rx = (right - inset) / width;
  const quad: Pt[] = [
    { x: lx, y: lb[0] / height },
    { x: rx, y: rb[0] / height },
    { x: rx, y: rb[1] / height },
    { x: lx, y: lb[1] / height },
  ];
  return isValidQuad(quad) ? quad : null;
}
