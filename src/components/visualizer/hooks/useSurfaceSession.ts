"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LoadSource, Pt, SurfaceId } from "../types";
import { canvasToJpeg } from "../helpers";

/* The scene scan, exactly as the analyze route promises it. The server
   stream owns the other side of this contract. */
export type VisualizerScanSurface = {
  kind: SurfaceId;
  name: string;
  tap: { x: number; y: number };
  occluders: string[];
  confidence: number;
};

export type VisualizerScan = {
  scene: string;
  surfaces: VisualizerScanSurface[];
  prepMode: "primer" | "blur" | "none";
  note: string;
  confidence: number;
};

type AnalyzePayload = {
  ok?: boolean;
  available?: boolean;
  scan?: VisualizerScan;
  message?: string;
};

export type SessionStepState = "pending" | "finding" | "done" | "failed";
export type SessionStep = { kind: SurfaceId; name: string; state: SessionStepState };

/* The scan only speaks up above this; anything shakier stays silent
   and the manual flow stands untouched. */
const MIN_CONFIDENCE = 0.55;

/* One breath so React commits a layer swap before the next closure is
   read from the live ref. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

interface UseSurfaceSessionParams {
  enabled: boolean;
  photo: HTMLImageElement | null;
  photoSource: LoadSource;
  samBusy: boolean;
  addSurfaceLayer: (kind?: SurfaceId) => boolean;
  activateLayerKind: (kind: SurfaceId) => boolean;
  runSam: (point: Pt) => Promise<boolean>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
}

/* The guided session. A new photo gets one quiet scan; a confident scan
   opens the offer; accept walks the found surfaces one by one through
   the same layer desk and finder the hands use, so nothing here owns a
   second copy of any commit logic. */
export function useSurfaceSession(params: UseSurfaceSessionParams) {
  const { enabled, photo, photoSource } = params;

  const [scan, setScan] = useState<VisualizerScan | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [steps, setSteps] = useState<SessionStep[]>([]);

  /* The accept loop spans many awaits, so it must never trust the
     closures it started with: this ref carries each render's fresh
     helpers, and the loop re-reads it after every settle. */
  const live = useRef(params);
  useEffect(() => {
    live.current = params;
  });

  const scanSeq = useRef(0);
  const scannedPhoto = useRef<HTMLImageElement | null>(null);
  const runningRef = useRef(false);

  /* One scan per photo, keyed on the image object itself. Only photos a
     person chose get scanned; the house sample loads on every visit and
     must never spend a metered call. */
  useEffect(() => {
    if (!enabled || !photo || photoSource === "default" || scannedPhoto.current === photo) return;
    scannedPhoto.current = photo;
    const ticket = scanSeq.current + 1;
    scanSeq.current = ticket;
    const scanPhoto = async () => {
      /* off the effect's own tick, so the clear cannot cascade */
      await Promise.resolve();
      if (ticket !== scanSeq.current) return;
      setScan(null);
      setSteps([]);
      setOfferOpen(false);
      const shot = (() => {
        try {
          return canvasToJpeg(photo, 768);
        } catch {
          return null;
        }
      })();
      if (!shot) return;
      try {
        const res = await fetch("/api/visualizer/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            image: shot.base64,
            mediaType: "image/jpeg",
            width: shot.width,
            height: shot.height,
          }),
        });
        const data = (await res.json()) as AnalyzePayload;
        if (ticket !== scanSeq.current) return;
        if (
          data.ok === true &&
          data.available === true &&
          data.scan &&
          data.scan.confidence >= MIN_CONFIDENCE &&
          Array.isArray(data.scan.surfaces) &&
          data.scan.surfaces.length > 0
        ) {
          setScan(data.scan);
          setOfferOpen(true);
        }
      } catch {
        /* silent by design: the corners still work */
      }
    };
    void scanPhoto();
  }, [enabled, photo, photoSource]);

  /* Tile the chosen surfaces in scan order, one finder call at a time.
     A failure marks its step and the walk carries on. */
  const accept = useCallback(async (selectedKinds: SurfaceId[]) => {
    const current = scan;
    if (!current || runningRef.current || live.current.samBusy) return;
    const chosen = current.surfaces.filter((surface) => selectedKinds.includes(surface.kind));
    if (chosen.length === 0) {
      setOfferOpen(false);
      return;
    }
    runningRef.current = true;
    setSessionRunning(true);
    setSteps(chosen.map((surface) => ({ kind: surface.kind, name: surface.name, state: "pending" })));
    const ticket = scanSeq.current;
    for (const surface of chosen) {
      /* one breath first, so the previous find's commit lands before
         the layer desk snapshots the active controls */
      await settle();
      /* a fresh photo mid-walk ends the session quietly */
      if (ticket !== scanSeq.current) break;
      const helpers = live.current;
      const ready = helpers.activateLayerKind(surface.kind) || helpers.addSurfaceLayer(surface.kind);
      setSteps((prev) => prev.map((step) => (
        step.kind === surface.kind ? { ...step, state: ready ? "finding" : "failed" } : step
      )));
      if (!ready) continue;
      helpers.setSnapMessage(`Finding ${surface.name}.`);
      await settle();
      const landed = await live.current.runSam(surface.tap);
      setSteps((prev) => prev.map((step) => (
        step.kind === surface.kind ? { ...step, state: landed ? "done" : "failed" } : step
      )));
    }
    if (ticket === scanSeq.current) {
      live.current.setSnapMessage("All set. Drag any corner to refine.");
      setOfferOpen(false);
    }
    runningRef.current = false;
    setSessionRunning(false);
  }, [scan]);

  /* Put the offer away for this photo; the scan itself keeps quiet. */
  const dismiss = useCallback(() => {
    setOfferOpen(false);
  }, []);

  return { scan, offerOpen, sessionRunning, steps, accept, dismiss };
}
