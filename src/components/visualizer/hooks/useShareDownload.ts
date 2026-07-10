"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Piece } from "@/lib/products";
import { SITE } from "@/lib/site";
import { wa } from "@/lib/wa";
import type { SurfaceLayer } from "../types";
import { buzz } from "../helpers";

interface UseShareDownloadParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  layers: SurfaceLayer[];
  activeLayerId: string;
  piece: Piece;
  pieceMap: Map<string, Piece>;
  withActiveLayer: (current: SurfaceLayer[]) => SurfaceLayer[];
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
}

/* Sending the look out of the house: the native share sheet when the
   device has one, a straight download otherwise, and the WhatsApp line
   that names every visible surface. Reads the same canvas and layer desk
   the stage paints; owns nothing. */
export function useShareDownload(params: UseShareDownloadParams) {
  const { canvasRef, layers, activeLayerId, piece, pieceMap, withActiveLayer, setSnapMessage } = params;

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentLayers = withActiveLayer(layers).filter((layer) => layer.visible);
    const layerSummary = currentLayers.map((layer) => {
      const layerPiece = pieceMap.get(layer.pieceSlug) ?? piece;
      return `${layer.label}: ${layerPiece.name}`;
    }).join("; ");
    const primaryLayer = currentLayers.find((layer) => layer.id === activeLayerId) ?? currentLayers[0];
    const primaryPiece = primaryLayer ? pieceMap.get(primaryLayer.pieceSlug) ?? piece : piece;
    const fileName = currentLayers.length > 1 ? "au-mosaic-visualizer-surfaces.png" : `au-mosaic-${primaryPiece.slug}.png`;
    const shareText = layerSummary || piece.name;
    track("viz_share", { piece: primaryPiece.slug, layers: currentLayers.length });
    buzz(8);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${shareText} · ${SITE.url.replace(/^https?:\/\//, "")}` });
          return;
        } catch {}
      }
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = file.name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setSnapMessage("Preview saved. Attach it in WhatsApp.");
      window.open(wa(`Hello AU Mosaic, I visualised ${shareText} in my space. Please send a quote.`), "_blank");
    }, "image/png");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentLayers = withActiveLayer(layers).filter((layer) => layer.visible);
    const primaryLayer = currentLayers.find((layer) => layer.id === activeLayerId) ?? currentLayers[0];
    const primaryPiece = primaryLayer ? pieceMap.get(primaryLayer.pieceSlug) ?? piece : piece;
    const fileName = currentLayers.length > 1 ? "au-mosaic-visualizer-surfaces.png" : `au-mosaic-${primaryPiece.slug}.png`;
    track("viz_download", { piece: primaryPiece.slug, layers: currentLayers.length });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
  };

  return { share, download };
}
