"use client";

import { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Pt } from "../types";
import { buzz } from "../helpers";
import { clamp, isValidQuad } from "../geometry";
import type { VizSnapshot } from "./useSnapshots";

interface UseSamAutofindParams {
  originalRef: RefObject<HTMLCanvasElement | null>;
  quad: Pt[];
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  setSamMask: Dispatch<SetStateAction<HTMLImageElement | null>>;
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
    quad,
    setQuad,
    setSamMask,
    setHasFittedSurface,
    setSnapMessage,
    pushSnapshot,
  } = params;

  const [samBeta, setSamBeta] = useState(false);
  const [samBusy, setSamBusy] = useState(false);

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
          setHasFittedSurface(true);
          let fittedQuad = quad;
          /* Fit the four corners to the shape's own extreme corners, not
             its bounding box. A floor comes back as a receding trapezoid,
             so the tiles take its perspective on their own and slant into
             depth; a wall stays roughly square. The mask still clips the
             exact shape, so an approximate plane is safe. */
          try {
            const mc = document.createElement("canvas");
            mc.width = img.naturalWidth;
            mc.height = img.naturalHeight;
            const mx = mc.getContext("2d");
            if (mx && mc.width > 0 && mc.height > 0) {
              mx.drawImage(img, 0, 0);
              const d = mx.getImageData(0, 0, mc.width, mc.height).data;
              let tl = { x: 0, y: 0 }, tr = { x: 0, y: 0 }, br = { x: 0, y: 0 }, bl = { x: 0, y: 0 };
              let tlV = Infinity, brV = -Infinity, trV = -Infinity, blV = Infinity;
              let found = false;
              for (let yy = 0; yy < mc.height; yy += 2) {
                for (let xx = 0; xx < mc.width; xx += 2) {
                  if (d[(yy * mc.width + xx) * 4 + 3] > 12) {
                    found = true;
                    const s = xx + yy;
                    const df = xx - yy;
                    if (s < tlV) { tlV = s; tl = { x: xx, y: yy }; }
                    if (s > brV) { brV = s; br = { x: xx, y: yy }; }
                    if (df > trV) { trV = df; tr = { x: xx, y: yy }; }
                    if (df < blV) { blV = df; bl = { x: xx, y: yy }; }
                  }
                }
              }
              if (found) {
                const norm = (p: { x: number; y: number }) => ({
                  x: clamp(p.x / mc.width, 0.02, 0.98),
                  y: clamp(p.y / mc.height, 0.02, 0.98),
                });
                const cornerQuad = [norm(tl), norm(tr), norm(br), norm(bl)];
                if (isValidQuad(cornerQuad)) { fittedQuad = cornerQuad; setQuad(cornerQuad); }
              }
            }
          } catch {
            /* leave the current corners */
          }
          /* Save the AI result the moment it lands, so a re-find, a clear,
             or a fresh tap can never lose the segment we paid for. */
          pushSnapshot("AI find", { samMask: img, quad: fittedQuad, hasFittedSurface: true });
          setSnapMessage("Surface found and angled. Nudge a corner to refine.");
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
    setSnapMessage("Auto-find cleared. The tiles fill the frame again.");
    buzz(3);
  };

  return { samBeta, samBusy, runSam, armSam, clearSam };
}
