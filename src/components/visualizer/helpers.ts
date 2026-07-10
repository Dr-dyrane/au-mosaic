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

/* The one downscale-and-encode. The finder and the scene scan both send
   the photo as a small JPEG, base64 without the data prefix, so the wire
   shape lives here once. Null means the source had no pixels or no
   context; encoding faults still throw, exactly as before. */
function canvasToJpeg(
  source: HTMLCanvasElement | HTMLImageElement,
  maxWidth: number,
): { base64: string; width: number; height: number } | null {
  const sourceW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (!sourceW || !sourceH) return null;
  const scale = Math.min(1, maxWidth / sourceW);
  const width = Math.max(1, Math.round(sourceW * scale));
  const height = Math.max(1, Math.round(sourceH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "";
  return { base64, width, height };
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

export { buzz, pieceSlugForSurface, suggestionText, shouldKeepCurrentFit, canvasToJpeg, readStore };
