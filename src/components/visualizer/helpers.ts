import type { SurfaceId, PrepMode, Pt, SnapResult } from "./types";
import type { Piece } from "@/lib/products";
import { isValidQuad, quadDelta } from "./geometry";
import { SURFACES, PREFERRED_PIECES, STORE_KEY } from "./constants";

const buzz = (ms = 4) => {
  try { navigator.vibrate?.(ms); } catch {}
};

function pieceSlugForSurface(surface: SurfaceId, pieces: Piece[], fallback: string) {
  const preferred = PREFERRED_PIECES[surface];
  if (pieces.some((piece) => piece.slug === preferred)) return preferred;
  return fallback;
}

function suggestionText(surface: SurfaceId, prep: PrepMode, pieceName: string) {
  const prepLabel = prep === "primer" ? "primer" : prep === "blur" ? "blur" : "original";
  return `Suggested: ${SURFACES[surface].label}, ${prepLabel}, ${pieceName}.`;
}

function shouldKeepCurrentFit(found: SnapResult, current: Pt[], alreadyFit: boolean) {
  if (!alreadyFit || !isValidQuad(current)) return false;
  const movement = quadDelta(found.quad, current);
  if (movement < 0.055) return false;
  if (found.confidence >= 1.62 && movement < 0.13) return false;
  return true;
}

/* Saved controls, if the browser kept them. Safe on the server:
   the first rendered photo is still the house's empty pool. */
function readStore(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

export { buzz, pieceSlugForSurface, suggestionText, shouldKeepCurrentFit, readStore };
