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
  hasFittedSurface: boolean;
  setHasFittedSurface: Dispatch<SetStateAction<boolean>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
  samMaskSrc: string | null;
  setSamMaskSrc: Dispatch<SetStateAction<string | null>>;
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
    hasFittedSurface,
    setHasFittedSurface,
    setSamMask,
    samMaskSrc,
    setSamMaskSrc,
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
    shellFloor,
    pieceSlug,
    tileSize,
    blend,
    prepMode,
    groutLight,
    customColors,
    maskSrc: samMaskSrc,
    visible: true,
    accepted: hasFittedSurface,
  }), [activeLayerId, blend, customColors, groutLight, hasFittedSurface, pieceSlug, prepMode, quad, samMaskSrc, shellFloor, surface, tileSize]);

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
    setShellFloor(layer.shellFloor);
    setPieceSlug(layer.pieceSlug);
    setTileSize(layer.tileSize);
    setBlend(layer.blend);
    setPrepMode(layer.prepMode);
    setGroutLight(layer.groutLight);
    setCustomColors(layer.customColors);
    setSamMask(null);
    setSamMaskSrc(layer.maskSrc);
    setHasFittedSurface(layer.accepted);
    setSnapMessage(`${layer.label} selected.`);
    buzz(3);
  }, [setActiveLayerId, setBlend, setCustomColors, setGroutLight, setHasFittedSurface, setLayers, setPieceSlug, setPrepMode, setQuad, setSamMask, setSamMaskSrc, setShellFloor, setSnapMessage, setSurface, setTileSize, withActiveLayer]);

  /* Without a kind the desk picks the next natural surface, as before.
     The guided session names the kind it wants and reads the boolean to
     know whether a layer actually landed. */
  const addSurfaceLayer = (kind?: SurfaceId): boolean => {
    const committedLayers = withActiveLayer(layers);
    if (!hasFittedSurface) {
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
      visible: true,
      accepted: true,
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
    setTileSize(nextLayer.tileSize);
    setPrepMode("primer");
    setHasFittedSurface(true);
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
      hasFittedSurface: true,
    });
    setSnapMessage(`Added ${nextLayer.label}. Drag its corners to place it.`);
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
    setHasFittedSurface(nextActive.accepted);
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
      hasFittedSurface: nextActive.accepted,
    });
    setSnapMessage(`Removed ${removedLabel}. ${nextActive.label} selected.`);
    buzz(4);
    track("viz_layer_remove", { surface: nextActive.surface });
  };

  const selectLayerChip = (layer: SurfaceLayer) =>
    selectLayer(layer.id === activeLayerId ? activeLayerSnapshot() : layer);

  /* The guided session asks for a kind, not an id. True means that
     kind's layer is now the active one; false means it is not on the
     desk at all. Same commit path as the chips. */
  const activateLayerKind = useCallback((kind: SurfaceId): boolean => {
    const layer = layers.find((candidate) => candidate.surface === kind);
    if (!layer) return false;
    selectLayer(layer.id === activeLayerId ? activeLayerSnapshot() : layer);
    return true;
  }, [activeLayerId, activeLayerSnapshot, layers, selectLayer]);

  return { activeLayerSnapshot, withActiveLayer, selectLayer, addSurfaceLayer, removeSurfaceLayer, selectLayerChip, activateLayerKind };
}
