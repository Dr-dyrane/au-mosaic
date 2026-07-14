"use client";

import { useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Piece } from "@/lib/products";
import type { FitState, Pt, PrepMode, ShellFaceId, SurfaceId, SurfaceLayer, FaceMask } from "../types";
import { adjustingFit, createFitState } from "../fitState";
import { buzz, pieceSlugForSurface } from "../helpers";
import { SURFACES, LAYER_LABELS, NEXT_SURFACE } from "../constants";
import type { VizSnapshot } from "./useSnapshots";

interface UseSurfaceLayersParams {
  layers: SurfaceLayer[];
  setLayers: Dispatch<SetStateAction<SurfaceLayer[]>>;
  activeLayerId: string;
  setActiveLayerId: Dispatch<SetStateAction<string>>;
  surface: SurfaceId;
  setSurface: Dispatch<SetStateAction<SurfaceId>>;
  quad: Pt[];
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  shellFloor: Pt[] | null;
  setShellFloor: Dispatch<SetStateAction<Pt[] | null>>;
  pieceSlug: string;
  setPieceSlug: Dispatch<SetStateAction<string>>;
  tileSize: number;
  setTileSize: Dispatch<SetStateAction<number>>;
  blend: number;
  setBlend: Dispatch<SetStateAction<number>>;
  prepMode: PrepMode;
  setPrepMode: Dispatch<SetStateAction<PrepMode>>;
  groutLight: boolean;
  setGroutLight: Dispatch<SetStateAction<boolean>>;
  customColors: string[] | null;
  setCustomColors: Dispatch<SetStateAction<string[] | null>>;
  fitState: FitState;
  setFitState: Dispatch<SetStateAction<FitState>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
  samMaskSrc: string | null;
  setSamMaskSrc: Dispatch<SetStateAction<string | null>>;
  faceMasks: Partial<Record<ShellFaceId, FaceMask>> | null;
  setFaceMasks: Dispatch<SetStateAction<Partial<Record<ShellFaceId, FaceMask>> | null>>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
  pushSnapshot: (note: string, over?: Partial<VizSnapshot>) => void;
  pieces: Piece[];
  cancelFind: () => void;
}

/* The surface-layer desk. A preview can hold several surface layers, one
   active at a time. This hook snapshots the live controls back into the
   active layer, swaps the controls over when the visitor picks another
   layer, and adds or takes a layer off, checkpointing each change through
   the shared snapshot memory. The layer list itself stays in the
   orchestrator, so the render reads it and the undo memory writes it; this
   hook only receives it with its setter. */
export function useSurfaceLayers(params: UseSurfaceLayersParams) {
  const {
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    surface,
    setSurface,
    quad,
    setQuad,
    shellFloor,
    setShellFloor,
    pieceSlug,
    setPieceSlug,
    tileSize,
    setTileSize,
    blend,
    setBlend,
    prepMode,
    setPrepMode,
    groutLight,
    setGroutLight,
    customColors,
    setCustomColors,
    fitState,
    setFitState,
    setSamMask,
    samMaskSrc,
    setSamMaskSrc,
    faceMasks,
    setFaceMasks,
    setSnapMessage,
    pushSnapshot,
    pieces,
    cancelFind,
  } = params;

  const layerSeq = useRef(1);

  const activeLayerSnapshot = useCallback((): SurfaceLayer => ({
    id: activeLayerId,
    label: LAYER_LABELS[surface],
    surface,
    quad,
    shellFloor,
    pieceSlug,
    tileSize,
    blend,
    prepMode,
    groutLight,
    customColors,
    maskSrc: samMaskSrc,
    faceMasks,
    visible: true,
    fit: fitState.status === "finding" ? adjustingFit(fitState) : fitState,
  }), [activeLayerId, blend, customColors, faceMasks, fitState, groutLight, pieceSlug, prepMode, quad, samMaskSrc, shellFloor, surface, tileSize]);

  const withActiveLayer = useCallback((current: SurfaceLayer[]) => {
    const next = activeLayerSnapshot();
    return current.map((layer) => (
      layer.id === activeLayerId ? { ...layer, ...next, label: LAYER_LABELS[surface] } : layer
    ));
  }, [activeLayerId, activeLayerSnapshot, surface]);

  const selectLayer = useCallback((layer: SurfaceLayer) => {
    cancelFind();
    setLayers(withActiveLayer);
    setActiveLayerId(layer.id);
    setSurface(layer.surface);
    setQuad(layer.quad);
    setShellFloor(layer.shellFloor);
    setPieceSlug(layer.pieceSlug);
    setTileSize(layer.tileSize);
    setBlend(layer.blend);
    setPrepMode(layer.prepMode);
    setGroutLight(layer.groutLight);
    setCustomColors(layer.customColors);
    setSamMask(null);
    setSamMaskSrc(layer.maskSrc);
    setFaceMasks(layer.faceMasks);
    setFitState({ ...layer.fit });
    setSnapMessage(`${layer.label} selected.`);
    buzz(3);
  }, [cancelFind, setActiveLayerId, setBlend, setCustomColors, setFaceMasks, setFitState, setGroutLight, setLayers, setPieceSlug, setPrepMode, setQuad, setSamMask, setSamMaskSrc, setShellFloor, setSnapMessage, setSurface, setTileSize, withActiveLayer]);

  /* Without a kind the desk picks the next natural surface, as before.
     The guided session names the kind it wants and reads the boolean to
     know whether a layer actually landed. */
  const addSurfaceLayer = (kind?: SurfaceId): boolean => {
    const committedLayers = withActiveLayer(layers);
    if (fitState.status !== "accepted") {
      setLayers(committedLayers);
      setSnapMessage(`Place ${LAYER_LABELS[surface]} first.`);
      buzz(2);
      return false;
    }
    const used = new Set(committedLayers.map((layer) => layer.surface));
    if (kind && used.has(kind)) {
      setLayers(committedLayers);
      setSnapMessage(`${LAYER_LABELS[kind]} is already in this preview.`);
      buzz(2);
      return false;
    }
    const nextSurface = kind ?? NEXT_SURFACE[surface].find((candidate) => !used.has(candidate));
    if (!nextSurface) {
      setLayers(committedLayers);
      setSnapMessage("Every surface type is already in this preview.");
      buzz(2);
      return false;
    }
    const nextPieceSlug = pieceSlugForSurface(nextSurface, pieces, pieceSlug);
    const id = `surface-${layerSeq.current + 1}`;
    layerSeq.current += 1;
    const nextLayer: SurfaceLayer = {
      id,
      label: LAYER_LABELS[nextSurface],
      surface: nextSurface,
      quad: SURFACES[nextSurface].quad,
      pieceSlug: nextPieceSlug,
      tileSize: SURFACES[nextSurface].tileSize,
      blend,
      prepMode: "primer",
      groutLight,
      customColors: null,
      maskSrc: null,
      shellFloor: null,
      faceMasks: null,
      visible: true,
      fit: createFitState(),
    };
    setLayers(committedLayers.concat(nextLayer));
    setActiveLayerId(id);
    setSurface(nextSurface);
    setQuad(nextLayer.quad);
    setShellFloor(null);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setSamMask(null);
    setSamMaskSrc(null);
    setFaceMasks(null);
    setTileSize(nextLayer.tileSize);
    setPrepMode("primer");
    setFitState(nextLayer.fit);
    pushSnapshot(`Added ${nextLayer.label}`, {
      layers: committedLayers.concat(nextLayer),
      activeLayerId: id,
      surface: nextSurface,
      quad: nextLayer.quad,
      shellFloor: null,
      pieceSlug: nextPieceSlug,
      tileSize: nextLayer.tileSize,
      prepMode: "primer",
      customColors: null,
      samMask: null,
      samMaskSrc: null,
      faceMasks: null,
      fitState: nextLayer.fit,
    });
    setSnapMessage(`Added ${nextLayer.label}. Find it or place it by hand.`);
    buzz(5);
    track("viz_layer_add", { surface: nextSurface });
    return true;
  };

  /* Take a surface back off. The last one stays, since the preview needs
     at least one; removing the active surface drops it and lands on the
     one before it, its own fit and colour intact. */
  const removeSurfaceLayer = () => {
    if (layers.length <= 1) return;
    const removedLabel = LAYER_LABELS[surface];
    const remaining = layers.filter((layer) => layer.id !== activeLayerId);
    const nextActive = remaining[remaining.length - 1];
    setLayers(remaining);
    setActiveLayerId(nextActive.id);
    setSurface(nextActive.surface);
    setQuad(nextActive.quad);
    setShellFloor(nextActive.shellFloor);
    setPieceSlug(nextActive.pieceSlug);
    setTileSize(nextActive.tileSize);
    setBlend(nextActive.blend);
    setPrepMode(nextActive.prepMode);
    setGroutLight(nextActive.groutLight);
    setCustomColors(nextActive.customColors);
    setSamMask(null);
    setSamMaskSrc(nextActive.maskSrc);
    setFaceMasks(nextActive.faceMasks);
    setFitState({ ...nextActive.fit });
    pushSnapshot(`Removed ${removedLabel}`, {
      layers: remaining,
      activeLayerId: nextActive.id,
      surface: nextActive.surface,
      quad: nextActive.quad,
      shellFloor: nextActive.shellFloor,
      pieceSlug: nextActive.pieceSlug,
      tileSize: nextActive.tileSize,
      blend: nextActive.blend,
      prepMode: nextActive.prepMode,
      groutLight: nextActive.groutLight,
      customColors: nextActive.customColors,
      samMask: null,
      samMaskSrc: nextActive.maskSrc,
      faceMasks: nextActive.faceMasks,
      fitState: nextActive.fit,
    });
    setSnapMessage(`Removed ${removedLabel}. ${nextActive.label} selected.`);
    buzz(4);
    track("viz_layer_remove", { surface: nextActive.surface });
  };

  const selectLayerChip = (layer: SurfaceLayer) =>
    selectLayer(layer.id === activeLayerId ? activeLayerSnapshot() : layer);

  return { activeLayerSnapshot, withActiveLayer, selectLayer, addSurfaceLayer, removeSurfaceLayer, selectLayerChip };
}
