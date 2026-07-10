"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Pt, PrepMode, ShellFaceId, SurfaceId, SurfaceLayer, FaceMask } from "../types";
import { buzz } from "../helpers";

/* A saved look. Everything the stage needs to reproduce a view, the AI
   mask included, so a segment we paid for is never lost to the next tap.
   Snapshots are kept as a short stack the visitor steps back and forth
   through. */
export type VizSnapshot = {
  note: string;
  layers: SurfaceLayer[];
  activeLayerId: string;
  surface: SurfaceId;
  quad: Pt[];
  shellFloor: Pt[] | null;
  pieceSlug: string;
  tileSize: number;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  customColors: string[] | null;
  hasFittedSurface: boolean;
  samMask: HTMLImageElement | null;
  samMaskSrc: string | null;
  faceMasks: Partial<Record<ShellFaceId, FaceMask>> | null;
};

const MAX_SNAPSHOTS = 12;

interface UseSnapshotsParams {
  photo: HTMLImageElement | null;
  layers: SurfaceLayer[];
  activeLayerId: string;
  surface: SurfaceId;
  quad: Pt[];
  shellFloor: Pt[] | null;
  pieceSlug: string;
  tileSize: number;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  customColors: string[] | null;
  hasFittedSurface: boolean;
  samMask: HTMLImageElement | null;
  samMaskSrc: string | null;
  faceMasks: Partial<Record<ShellFaceId, FaceMask>> | null;
  setLayers: Dispatch<SetStateAction<SurfaceLayer[]>>;
  setActiveLayerId: Dispatch<SetStateAction<string>>;
  setSurface: Dispatch<SetStateAction<SurfaceId>>;
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  setShellFloor: Dispatch<SetStateAction<Pt[] | null>>;
  setPieceSlug: Dispatch<SetStateAction<string>>;
  setTileSize: Dispatch<SetStateAction<number>>;
  setBlend: Dispatch<SetStateAction<number>>;
  setPrepMode: Dispatch<SetStateAction<PrepMode>>;
  setGroutLight: Dispatch<SetStateAction<boolean>>;
  setCustomColors: Dispatch<SetStateAction<string[] | null>>;
  setHasFittedSurface: Dispatch<SetStateAction<boolean>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
  setSamMaskSrc: Dispatch<SetStateAction<string | null>>;
  setFaceMasks: Dispatch<SetStateAction<Partial<Record<ShellFaceId, FaceMask>> | null>>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
}

/* The studio's undo memory. It reads the live controls to build a
   checkpoint and writes them all back to restore one, so the whole editable
   view (the AI mask included) travels together. Back and forward step the
   stack; a fresh photo opens a new one seeded with its clean placement. */
export function useSnapshots(params: UseSnapshotsParams) {
  const {
    photo,
    layers,
    activeLayerId,
    surface,
    quad,
    shellFloor,
    pieceSlug,
    tileSize,
    blend,
    prepMode,
    groutLight,
    customColors,
    hasFittedSurface,
    samMask,
    samMaskSrc,
    faceMasks,
    setLayers,
    setActiveLayerId,
    setSurface,
    setQuad,
    setShellFloor,
    setPieceSlug,
    setTileSize,
    setBlend,
    setPrepMode,
    setGroutLight,
    setCustomColors,
    setHasFittedSurface,
    setSamMask,
    setSamMaskSrc,
    setFaceMasks,
    setSnapMessage,
  } = params;

  const [history, setHistory] = useState<{ snaps: VizSnapshot[]; i: number }>({ snaps: [], i: -1 });
  const historySeed = useRef<HTMLImageElement | null>(null);

  /* Save the whole editable view as one snapshot: current values, unless
     the caller hands fresher ones (the AI find passes its mask and fit
     straight in, before React state has caught up). */
  const buildSnapshot = useCallback((note: string, over: Partial<VizSnapshot> = {}): VizSnapshot => ({
    note,
    layers: (over.layers ?? layers).map((l) => ({
      ...l,
      quad: l.quad.map((p) => ({ ...p })),
      shellFloor: l.shellFloor ? l.shellFloor.map((p) => ({ ...p })) : null,
      faceMasks: l.faceMasks ? { ...l.faceMasks } : null,
    })),
    activeLayerId: over.activeLayerId ?? activeLayerId,
    surface: over.surface ?? surface,
    quad: (over.quad ?? quad).map((p) => ({ ...p })),
    shellFloor: (over.shellFloor !== undefined ? over.shellFloor : shellFloor)?.map((p) => ({ ...p })) ?? null,
    pieceSlug: over.pieceSlug ?? pieceSlug,
    tileSize: over.tileSize ?? tileSize,
    blend: over.blend ?? blend,
    prepMode: over.prepMode ?? prepMode,
    groutLight: over.groutLight ?? groutLight,
    customColors: over.customColors !== undefined ? over.customColors : customColors,
    hasFittedSurface: over.hasFittedSurface ?? hasFittedSurface,
    samMask: over.samMask !== undefined ? over.samMask : samMask,
    samMaskSrc: over.samMaskSrc !== undefined ? over.samMaskSrc : samMaskSrc,
    faceMasks: over.faceMasks !== undefined ? over.faceMasks : faceMasks,
  }), [layers, activeLayerId, surface, quad, shellFloor, pieceSlug, tileSize, blend, prepMode, groutLight, customColors, hasFittedSurface, samMask, samMaskSrc, faceMasks]);

  /* Append a checkpoint, dropping anything ahead of the cursor (a new
     move after stepping back forks a fresh line) and holding the stack to
     a sane length. */
  const pushSnapshot = useCallback((note: string, over: Partial<VizSnapshot> = {}) => {
    const snap = buildSnapshot(note, over);
    setHistory((h) => {
      const base = h.snaps.slice(0, h.i + 1);
      const next = [...base, snap].slice(-MAX_SNAPSHOTS);
      return { snaps: next, i: next.length - 1 };
    });
  }, [buildSnapshot]);

  /* Put a saved look back on the stage, mask and all. */
  const restoreSnapshot = useCallback((snap: VizSnapshot) => {
    setLayers(snap.layers.map((l) => ({ ...l })));
    setActiveLayerId(snap.activeLayerId);
    setSurface(snap.surface);
    setQuad(snap.quad.map((p) => ({ ...p })));
    setShellFloor(snap.shellFloor ? snap.shellFloor.map((p) => ({ ...p })) : null);
    setPieceSlug(snap.pieceSlug);
    setTileSize(snap.tileSize);
    setBlend(snap.blend);
    setPrepMode(snap.prepMode);
    setGroutLight(snap.groutLight);
    setCustomColors(snap.customColors);
    setHasFittedSurface(snap.hasFittedSurface);
    setSamMask(snap.samMask);
    setSamMaskSrc(snap.samMaskSrc);
    setFaceMasks(snap.faceMasks ? { ...snap.faceMasks } : null);
  }, [setLayers, setActiveLayerId, setSurface, setQuad, setShellFloor, setPieceSlug, setTileSize, setBlend, setPrepMode, setGroutLight, setCustomColors, setHasFittedSurface, setSamMask, setSamMaskSrc, setFaceMasks]);

  const stepHistory = useCallback((dir: -1 | 1) => {
    const target = history.i + dir;
    if (target < 0 || target >= history.snaps.length) return;
    restoreSnapshot(history.snaps[target]);
    setHistory((h) => ({ ...h, i: target }));
    setSnapMessage(`Snapshot ${target + 1} of ${history.snaps.length}. ${history.snaps[target].note}.`);
    buzz(4);
  }, [history, restoreSnapshot, setSnapMessage]);

  const pinLook = useCallback(() => {
    pushSnapshot("Pinned look");
    setSnapMessage("Look pinned. Step back and forward any time.");
    buzz(5);
  }, [pushSnapshot, setSnapMessage]);

  /* Each fresh photo opens a new history, seeded with its clean
     placement, so Back always returns to the untouched surface. */
  useEffect(() => {
    if (!photo || historySeed.current === photo) return;
    historySeed.current = photo;
    setHistory({ snaps: [buildSnapshot("Start")], i: 0 });
  }, [photo, buildSnapshot]);

  return { history, pushSnapshot, stepHistory, pinLook };
}
