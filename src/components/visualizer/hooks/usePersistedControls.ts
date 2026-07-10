import { useEffect } from "react";
import type { Pt, PrepMode, SurfaceLayer } from "../types";
import { STORE_KEY } from "../constants";

interface PersistedControlsArgs {
  photo: HTMLImageElement | null;
  quad: Pt[];
  tileSize: number;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  pieceSlug: string;
  customColors: string[] | null;
  layers: SurfaceLayer[];
  withActiveLayer: (current: SurfaceLayer[]) => SurfaceLayer[];
}

export function usePersistedControls({
  photo,
  quad,
  tileSize,
  blend,
  prepMode,
  groutLight,
  pieceSlug,
  customColors,
  layers,
  withActiveLayer,
}: PersistedControlsArgs) {
  useEffect(() => {
    if (!photo) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          STORE_KEY,
          /* Masks are data URIs far past the localStorage quota; the
             quads persist, the segments are found again per photo. */
          JSON.stringify({ quad, tileSize, blend, prepMode, groutLight, pieceSlug, customColors, layers: withActiveLayer(layers).map((l) => ({ ...l, maskSrc: null })) })
        );
      } catch {}
    }, 600);
    return () => clearTimeout(id);
  }, [photo, quad, tileSize, blend, prepMode, groutLight, pieceSlug, customColors, layers, withActiveLayer]);
}
