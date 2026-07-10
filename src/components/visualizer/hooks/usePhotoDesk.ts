"use client";

import { useCallback, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Piece } from "@/lib/products";
import type { LoadSource, PrepMode, Pt, SurfaceId, SurfaceLayer } from "../types";
import { CONTEXTS, FIRST_LAYER_ID, LAYER_LABELS, SURFACES } from "../constants";
import { buzz, pieceSlugForSurface, suggestionText } from "../helpers";
import { useCamera } from "./useCamera";

interface UsePhotoDeskParams {
  pieces: Piece[];
  piece: Piece;
  pieceSlug: string;
  surface: SurfaceId;
  shellFloor: Pt[] | null;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  withActiveLayer: (current: SurfaceLayer[]) => SurfaceLayer[];
  objectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  setPhoto: Dispatch<SetStateAction<HTMLImageElement | null>>;
  setPhotoSource: Dispatch<SetStateAction<LoadSource>>;
  setSurface: Dispatch<SetStateAction<SurfaceId>>;
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  setShellFloor: Dispatch<SetStateAction<Pt[] | null>>;
  setTileSize: Dispatch<SetStateAction<number>>;
  setPieceSlug: Dispatch<SetStateAction<string>>;
  setPrepMode: Dispatch<SetStateAction<PrepMode>>;
  setCustomColors: Dispatch<SetStateAction<string[] | null>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
  setSamMaskSrc: Dispatch<SetStateAction<string | null>>;
  setLayers: Dispatch<SetStateAction<SurfaceLayer[]>>;
  setActiveLayerId: Dispatch<SetStateAction<string>>;
  setHasFittedSurface: Dispatch<SetStateAction<boolean>>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
}

/* The photo desk, lifted out of the orchestrator: how a photo arrives
   (upload, camera, sample, starter) and what a surface retag does to the
   live controls. It does not own any of that state; the orchestrator
   hands in the values and setters and takes back the callables its JSX
   and hooks consume. useCamera lives here because loadImage is its
   capture handler and onFile clears its error, one loop, one home. */
export function usePhotoDesk(params: UsePhotoDeskParams) {
  const {
    pieces,
    piece,
    pieceSlug,
    surface,
    shellFloor,
    blend,
    prepMode,
    groutLight,
    withActiveLayer,
    objectUrl,
    revokeObjectUrl,
    videoRef,
    setPhoto,
    setPhotoSource,
    setSurface,
    setQuad,
    setShellFloor,
    setTileSize,
    setPieceSlug,
    setPrepMode,
    setCustomColors,
    setSamMask,
    setSamMaskSrc,
    setLayers,
    setActiveLayerId,
    setHasFittedSurface,
    setSnapMessage,
  } = params;

  const loadSeq = useRef(0);

  const loadImage = useCallback((
    src: string,
    from: LoadSource,
    nextQuad?: Pt[],
    nextSurface = surface,
    nextPieceSlug?: string
  ) => {
    const ticket = loadSeq.current + 1;
    loadSeq.current = ticket;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (ticket !== loadSeq.current) {
        revokeObjectUrl(src);
        return;
      }
      const preferredSlug = nextPieceSlug && pieces.some((item) => item.slug === nextPieceSlug)
        ? nextPieceSlug
        : pieceSlugForSurface(nextSurface, pieces, pieceSlug);
      const targetSurface = nextSurface;
      const targetPieceSlug = from === "default" ? pieceSlug : preferredSlug;
      const targetPrep: PrepMode = from === "default" ? prepMode : "primer";
      const targetTileSize = SURFACES[targetSurface].tileSize;
      const targetPiece = pieces.find((item) => item.slug === targetPieceSlug) ?? piece;
      const suggestion = suggestionText(targetSurface, targetPrep, targetPiece.name);
      /* No auto-detect: the mosaic lands on the surface's default frame
         and the four corners drag it onto the wall or floor. */
      const targetQuad = nextQuad ?? SURFACES[targetSurface].quad;
      /* The mount's default load keeps what the browser remembered, the
         shell floor included; a photo a person chose starts flat. */
      const targetShellFloor = from === "default" ? shellFloor : null;
      setHasFittedSurface(true);
      setSurface(targetSurface);
      setTileSize(targetTileSize);
      setPieceSlug(targetPieceSlug);
      setCustomColors(null);
      setSamMask(null);
      setSamMaskSrc(null);
      setPrepMode(targetPrep);
      setQuad(targetQuad);
      setShellFloor(targetShellFloor);
      /* A new photo means a new desk: one fresh layer mirroring the flat
         controls just set, so the last photo's surfaces cannot haunt it. */
      setLayers([
        {
          id: FIRST_LAYER_ID,
          label: LAYER_LABELS[targetSurface],
          surface: targetSurface,
          quad: targetQuad,
          pieceSlug: targetPieceSlug,
          tileSize: targetTileSize,
          blend,
          prepMode: targetPrep,
          groutLight,
          customColors: null,
          maskSrc: null,
          shellFloor: targetShellFloor,
          visible: true,
          accepted: true,
        },
      ]);
      setActiveLayerId(FIRST_LAYER_ID);
      setSnapMessage(suggestion);
      setPhoto(img);
      setPhotoSource(from);
      if (from !== "default") track("viz_photo", { source: from });
      revokeObjectUrl(src);
    };
    img.onerror = () => {
      if (ticket === loadSeq.current) setSnapMessage("That image did not open. Try another photo.");
      revokeObjectUrl(src);
    };
    img.src = src;
  }, [blend, groutLight, piece, pieceSlug, pieces, prepMode, revokeObjectUrl, shellFloor, surface, setActiveLayerId, setCustomColors, setHasFittedSurface, setLayers, setPhoto, setPhotoSource, setPieceSlug, setPrepMode, setQuad, setSamMask, setSamMaskSrc, setShellFloor, setSnapMessage, setSurface, setTileSize]);

  const { cameraOpen, cameraError, clearCameraError, openCamera, snapCamera, stopCamera } = useCamera({
    videoRef,
    objectUrl,
    setSnapMessage,
    surface,
    onCapture: loadImage,
  });

  const chooseStarterSurface = (id: SurfaceId) => {
    const nextPieceSlug = pieceSlugForSurface(id, pieces, pieceSlug);
    const nextPiece = pieces.find((item) => item.slug === nextPieceSlug) ?? piece;
    setLayers(withActiveLayer);
    setSurface(id);
    setTileSize(SURFACES[id].tileSize);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setSamMask(null);
    setSamMaskSrc(null);
    setPrepMode("primer");
    setQuad(SURFACES[id].quad);
    setShellFloor(null);
    setHasFittedSurface(true);
    setSnapMessage(suggestionText(id, "primer", nextPiece.name));
    buzz(4);
    track("viz_surface_choice", { surface: id });
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    clearCameraError();
    loadImage(objectUrl(f), "upload", undefined, surface);
  };

  const fitSurface = (id: SurfaceId) => {
    const next = SURFACES[id];
    const nextPieceSlug = pieceSlugForSurface(id, pieces, pieceSlug);
    const nextPiece = pieces.find((item) => item.slug === nextPieceSlug) ?? piece;
    setSurface(id);
    setTileSize(next.tileSize);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setSamMask(null);
    setSamMaskSrc(null);
    setPrepMode("primer");
    setQuad(next.quad);
    /* A retag folds the shell flat: the Shell toggle only lives on pool,
       so a stranded floor would have no way off the stage. */
    setShellFloor(null);
    setHasFittedSurface(true);
    setSnapMessage(suggestionText(id, "primer", nextPiece.name));
    buzz(4);
    track("viz_surface", { surface: id });
  };

  const loadContext = (id: SurfaceId) => {
    const context = CONTEXTS.find((item) => item.id === id);
    if (!context) return;
    const next = SURFACES[id];
    setSurface(id);
    setTileSize(next.tileSize);
    /* The photo lands later, or never on error, so fold the shell now:
       the retagged stage must not carry a stranded floor mid load. */
    setShellFloor(null);
    if (pieces.some((p) => p.slug === context.piece)) setPieceSlug(context.piece);
    loadImage(context.src, "sample", next.quad, id, context.piece);
    buzz(6);
    track("viz_context", { surface: id });
  };

  return {
    loadImage,
    chooseStarterSurface,
    onFile,
    fitSurface,
    loadContext,
    cameraOpen,
    cameraError,
    openCamera,
    snapCamera,
    stopCamera,
  };
}
