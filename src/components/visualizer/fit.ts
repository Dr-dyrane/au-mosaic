import type { Pt } from "./types";
import { isValidQuad } from "./geometry";
import type { BinaryMask } from "./fitMask";
import {
  SOLIDITY_FLOOR,
  convexHull,
  fillHoles,
  largestComponent,
  morphClose,
  morphOpen,
  solidity,
  traceBoundary,
} from "./fitMask";
import {
  contourCoverage,
  extremeCorners,
  houghQuadFit,
  minAreaRect,
  normalizeQuad,
  orderCorners,
} from "./fitQuad";

/* The mask-to-plane engine. The segment model hands back a binary mask;
   this module decides whether that outline is one clean plane worth four
   fitted corners, or a shape the mask should cut on its own. Pure math on
   a Uint8Array, no DOM, so the node tests can drive every stage. The
   stages live in fitMask.ts (the binary mask work) and fitQuad.ts (the
   corner work); this file keeps the pipeline and the public surface. */

export type FitResult =
  | { kind: "quad"; quad: Pt[]; confidence: number }
  | { kind: "clip" };

/* Walls face the camera, so their outline is their plane and the Hough
   ladder earns its keep. Floors recede: the outline is whatever the room
   happens to clip, not the plane itself. */
export type SurfaceKind = "wall" | "floor";

/* The split moved the stages, not the API: everything importable from
   fit.ts before the split still is. */
export type { BinaryMask } from "./fitMask";
export { largestComponent, morphOpen, morphClose, fillHoles, traceBoundary, convexHull, solidity } from "./fitMask";
export { houghLines, normalizeQuad, contourCoverage, houghQuadFit, minAreaRect, extremeCorners } from "./fitQuad";

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
