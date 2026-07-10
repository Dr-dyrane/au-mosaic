"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Pt, SurfaceId } from "../types";
import { buzz } from "../helpers";
import { fitMask } from "../fit";
import { seedMask } from "../maskCache";
import type { VizSnapshot } from "./useSnapshots";

interface UseSamAutofindParams {
  originalRef: RefObject<HTMLCanvasElement | null>;
  surface: SurfaceId;
  quad: Pt[];
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
  setSamMaskSrc: Dispatch<SetStateAction<string | null>>;
  setHasFittedSurface: Dispatch<SetStateAction<boolean>>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
  pushSnapshot: (note: string, over?: Partial<VizSnapshot>) => void;
}

/* The learned auto-find, lifted out of the orchestrator into its own hook. It
   owns the arm and busy flags on its own useState. It does NOT own samMask:
   that state stays in the orchestrator because the render and the snapshot
   restore both touch it, so the hook receives setSamMask and calls it. The
   untouched photo is read from originalRef, and the mask, the fitted corners,
   the surface flag, the messages, and the snapshot all travel back through the
   setters and pushSnapshot the orchestrator hands in. */
export function useSamAutofind(params: UseSamAutofindParams): {
  samBeta: boolean;
  samBusy: boolean;
  runSam: (point: Pt) => Promise<void>;
  armSam: () => void;
  clearSam: () => void;
} {
  const {
    originalRef,
    surface,
    quad,
    setQuad,
    setSamMask,
    setSamMaskSrc,
    setHasFittedSurface,
    setSnapMessage,
    pushSnapshot,
  } = params;

  const [samBeta, setSamBeta] = useState(false);
  const [samBusy, setSamBusy] = useState(false);

  /* runSam's onload fires long after the tap. Reading the quad from the
     render that armed it would checkpoint a stale plane if a corner moved
     during the model call, so the ref always carries the latest. */
  const quadRef = useRef(quad);
  useEffect(() => {
    quadRef.current = quad;
  }, [quad]);

  /* The learned auto-find (beta, opt-in). Arm it, then one tap sends the
     untouched photo and the tapped point to the segment endpoint; the mask
     that comes back clips the mosaic to the exact surface shape. Any miss
     falls back to the corners, so the desk is never stuck. Metered on the
     server. */
  const runSam = async (point: Pt) => {
    const orig = originalRef.current;
    if (!orig || samBusy) {
      setSamBeta(false);
      return;
    }
    setSamBusy(true);
    buzz(4);
    try {
      const ow = orig.width;
      const oh = orig.height;
      const scale = Math.min(1, 768 / ow);
      const sw = Math.max(1, Math.round(ow * scale));
      const sh = Math.max(1, Math.round(oh * scale));
      const tmp = document.createElement("canvas");
      tmp.width = sw;
      tmp.height = sh;
      const tctx = tmp.getContext("2d");
      if (!tctx) throw new Error("no-ctx");
      tctx.drawImage(orig, 0, 0, sw, sh);
      const base64 = tmp.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "";
      const res = await fetch("/api/visualizer/segment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mediaType: "image/jpeg",
          x: Math.round(point.x * sw),
          y: Math.round(point.y * sh),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; mask?: string; message?: string };
      if (data.ok && typeof data.mask === "string") {
        const img = new Image();
        img.onload = () => {
          setSamMask(img);
          setSamMaskSrc(data.mask as string);
          seedMask(data.mask as string, img);
          setHasFittedSurface(true);
          let fittedQuad = quadRef.current;
          let message = "Surface found. The shape is cut exactly; angle the tiles with the corners.";
          /* Hand the mask to the geometry engine. A floor comes back as a
             receding trapezoid, so the tiles take its perspective and
             slant into depth; a wall stays roughly square. When the
             outline is not one clean plane (furniture bites, an L-room)
             the engine says clip: the corners stay where they are and the
             mask cuts the exact shape. */
          try {
            const long = Math.max(1, img.naturalWidth, img.naturalHeight);
            const down = Math.min(1, 192 / long);
            const mw = Math.max(1, Math.round(img.naturalWidth * down));
            const mh = Math.max(1, Math.round(img.naturalHeight * down));
            const mc = document.createElement("canvas");
            mc.width = mw;
            mc.height = mh;
            const mx = mc.getContext("2d");
            if (mx && img.naturalWidth > 0 && img.naturalHeight > 0) {
              mx.drawImage(img, 0, 0, mw, mh);
              const d = mx.getImageData(0, 0, mw, mh).data;
              const bits = new Uint8Array(mw * mh);
              for (let i = 0; i < bits.length; i += 1) {
                if (d[i * 4 + 3] > 12) bits[i] = 1;
              }
              const result = fitMask(
                { data: bits, width: mw, height: mh },
                surface === "pool" || surface === "floor" ? "floor" : "wall",
              );
              if (result.kind === "quad") {
                fittedQuad = result.quad;
                setQuad(result.quad);
                message = "Surface found and angled. Nudge a corner to refine.";
              }
            }
          } catch {
            /* leave the current corners; the mask still clips the shape */
          }
          /* Save the AI result the moment it lands, so a re-find, a clear,
             or a fresh tap can never lose the segment we paid for. */
          pushSnapshot("AI find", { samMask: img, samMaskSrc: data.mask as string, quad: fittedQuad, hasFittedSurface: true });
          setSnapMessage(message);
          buzz(8);
        };
        img.onerror = () => setSnapMessage("Could not read the surface. Drag the corners instead.");
        img.src = data.mask;
        track("viz_sam", { ok: true });
      } else {
        setSnapMessage(data.message ?? "Could not find it there. Drag the corners instead.");
        track("viz_sam", { ok: false });
      }
    } catch {
      setSnapMessage("Auto-find is busy. Drag the corners instead.");
    } finally {
      setSamBusy(false);
      setSamBeta(false);
    }
  };

  const armSam = () => {
    if (samBusy) return;
    setSamBeta(true);
    setSnapMessage("Now tap the wall or floor.");
    buzz(3);
    track("viz_sam_arm", {});
  };

  const clearSam = () => {
    setSamMask(null);
    setSamMaskSrc(null);
    setSnapMessage("Auto-find cleared. The tiles fill the frame again.");
    buzz(3);
  };

  return { samBeta, samBusy, runSam, armSam, clearSam };
}
