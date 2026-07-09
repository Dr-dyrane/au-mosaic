"use client";

import { useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Piece } from "@/lib/products";
import type { Pt, PrepMode, SurfaceId, SurfaceLayer } from "../types";
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
  hasFittedSurface: boolean;
  setHasFittedSurface: Dispatch<SetStateAction<boolean>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
  pushSnapshot: (note: string, over?: Partial<VizSnapshot>) => void;
  pieces: Piece[];
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
    hasFittedSurface,
    setHasFittedSurface,
    setSamMask,
    setSnapMessage,
    pushSnapshot,
    pieces,
  } = params;

  const layerSeq = useRef(1);

  const activeLayerSnapshot = useCallback((): SurfaceLayer => ({
    id: activeLayerId,
    label: LAYER_LABELS[surface],
    surface,
    quad,
    pieceSlug,
    tileSize,
    blend,
    prepMode,
    groutLight,
    customColors,
    visible: true,
    accepted: hasFittedSurface,
  }), [activeLayerId, blend, customColors, groutLight, hasFittedSurface, pieceSlug, prepMode, quad, surface, tileSize]);

  const withActiveLayer = useCallback((current: SurfaceLayer[]) => {
    const next = activeLayerSnapshot();
    return current.map((layer) => (
      layer.id === activeLayerId ? { ...layer, ...next, label: LAYER_LABELS[surface] } : layer
    ));
  }, [activeLayerId, activeLayerSnapshot, surface]);

  const selectLayer = useCallback((layer: SurfaceLayer) => {
    setLayers(withActiveLayer);
    setActiveLayerId(layer.id);
    setSurface(layer.surface);
    setQuad(layer.quad);
    setPieceSlug(layer.pieceSlug);
    setTileSize(layer.tileSize);
    setBlend(layer.blend);
    setPrepMode(layer.prepMode);
    setGroutLight(layer.groutLight);
    setCustomColors(layer.customColors);
    setSamMask(null);
    setHasFittedSurface(layer.accepted);
    setSnapMessage(`${layer.label} selected.`);
    buzz(3);
  }, [setActiveLayerId, setBlend, setCustomColors, setGroutLight, setHasFittedSurface, setLayers, setPieceSlug, setPrepMode, setQuad, setSamMask, setSnapMessage, setSurface, setTileSize, withActiveLayer]);

  const addSurfaceLayer = () => {
    const committedLayers = withActiveLayer(layers);
    if (!hasFittedSurface) {
      setLayers(committedLayers);
      setSnapMessage(`Place ${LAYER_LABELS[surface]} first.`);
      buzz(2);
      return;
    }
    const used = new Set(committedLayers.map((layer) => layer.surface));
    const nextSurface = NEXT_SURFACE[surface].find((candidate) => !used.has(candidate));
    if (!nextSurface) {
      setLayers(committedLayers);
      setSnapMessage("Every surface type is already in this preview.");
      buzz(2);
      return;
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
      visible: true,
      accepted: true,
    };
    setLayers(committedLayers.concat(nextLayer));
    setActiveLayerId(id);
    setSurface(nextSurface);
    setQuad(nextLayer.quad);
    setPieceSlug(nextPieceSlug);
    setCustomColors(null);
    setSamMask(null);
    setTileSize(nextLayer.tileSize);
    setPrepMode("primer");
    setHasFittedSurface(true);
    pushSnapshot(`Added ${nextLayer.label}`, {
      layers: committedLayers.concat(nextLayer),
      activeLayerId: id,
      surface: nextSurface,
      quad: nextLayer.quad,
      pieceSlug: nextPieceSlug,
      tileSize: nextLayer.tileSize,
      prepMode: "primer",
      customColors: null,
      samMask: null,
      hasFittedSurface: true,
    });
    setSnapMessage(`Added ${nextLayer.label}. Drag its corners to place it.`);
    buzz(5);
    track("viz_layer_add", { surface: nextSurface });
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
    setPieceSlug(nextActive.pieceSlug);
    setTileSize(nextActive.tileSize);
    setBlend(nextActive.blend);
    setPrepMode(nextActive.prepMode);
    setGroutLight(nextActive.groutLight);
    setCustomColors(nextActive.customColors);
    setSamMask(null);
    setHasFittedSurface(nextActive.accepted);
    pushSnapshot(`Removed ${removedLabel}`, {
      layers: remaining,
      activeLayerId: nextActive.id,
      surface: nextActive.surface,
      quad: nextActive.quad,
      pieceSlug: nextActive.pieceSlug,
      tileSize: nextActive.tileSize,
      blend: nextActive.blend,
      prepMode: nextActive.prepMode,
      groutLight: nextActive.groutLight,
      customColors: nextActive.customColors,
      samMask: null,
      hasFittedSurface: nextActive.accepted,
    });
    setSnapMessage(`Removed ${removedLabel}. ${nextActive.label} selected.`);
    buzz(4);
    track("viz_layer_remove", { surface: nextActive.surface });
  };

  const selectLayerChip = (layer: SurfaceLayer) =>
    selectLayer(layer.id === activeLayerId ? activeLayerSnapshot() : layer);

  return { activeLayerSnapshot, withActiveLayer, selectLayer, addSurfaceLayer, removeSurfaceLayer, selectLayerChip };
}
