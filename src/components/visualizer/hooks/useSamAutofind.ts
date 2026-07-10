"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Pt, SurfaceId } from "../types";
import { buzz, canvasToJpeg } from "../helpers";
import { fitMask } from "../fit";
import { deriveShellFloor } from "../shellFit";
import { seedMask } from "../maskCache";
import type { VizSnapshot } from "./useSnapshots";

type SegmentPayload = {
  ok?: boolean;
  available?: boolean;
  pending?: boolean;
  id?: string;
  mask?: string;
  maskKind?: "alpha" | "luma";
  width?: number;
  height?: number;
  message?: string;
};

/* The same shape the server accepts, checked before any poll leaves. */
const TICKET = /^[A-Za-z0-9_-]{8,80}$/;

/* POST the tap, and when the server answers with a ticket instead of a
   mask, poll the free endpoint until the mask lands or patience runs
   out at 110 seconds from submit. Module scope on purpose: the wall
   clock lives out here, away from render. */
async function submitAndAwaitMask(
  payload: string,
  notifyWaking: () => void,
): Promise<SegmentPayload> {
  const submittedAt = Date.now();
  const res = await fetch("/api/visualizer/segment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
  });
  const data = (await res.json()) as SegmentPayload;
  if (data.ok && data.pending === true && typeof data.id === "string" && TICKET.test(data.id)) {
    /* Past a successful submit every miss belongs to the finder:
       offline mid-poll or a non-JSON body must not read as generic
       busyness. */
    try {
      return await pollForMask(data.id, submittedAt, notifyWaking);
    } catch (err) {
      if (err instanceof Error && err.message === "finder-timeout") throw err;
      throw new Error("finder-failed");
    }
  }
  return data;
}

/* Bring the ticket back every 1.5 seconds. After eight seconds of
   waiting the desk says why, once; past 110 seconds the hand takes
   over. */
async function pollForMask(
  id: string,
  submittedAt: number,
  notifyWaking: () => void,
): Promise<SegmentPayload> {
  let hinted = false;
  while (Date.now() - submittedAt < 110_000) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (!hinted && Date.now() - submittedAt > 8000) {
      notifyWaking();
      hinted = true;
    }
    const res = await fetch(`/api/visualizer/segment?id=${encodeURIComponent(id)}`);
    const data = (await res.json()) as SegmentPayload;
    if (data.ok && data.pending === true) continue;
    if (data.ok && typeof data.mask === "string") return data;
    throw new Error("finder-failed");
  }
  throw new Error("finder-timeout");
}

function loadMaskImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("mask-decode"));
    img.src = src;
  });
}

/* The one guardian of the alpha invariant: everything downstream clips
   by alpha. The server's maskKind is a hint only; the pixels decide.
   Sample the decoded mask's alpha on a stride: if every sample is
   opaque the shape can only live in luminance, so copy each pixel's
   brightness (the brightest of r, g, b) into its alpha and hand back a
   re-decoded image. If alpha varies, the mask is used as is. Any
   failure to read or rewrite the pixels throws mask-decode, exactly
   like a mask that never decoded. */
async function ensureAlphaMask(
  img: HTMLImageElement,
): Promise<{ img: HTMLImageElement; src: string | null }> {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new Error("mask-decode");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mask-decode");
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, w, h);
  const d = pixels.data;
  const stride = Math.max(1, Math.floor((w * h) / 4096)) * 4;
  let alphaVaries = false;
  for (let i = 3; i < d.length; i += stride) {
    if (d[i] <= 250) {
      alphaVaries = true;
      break;
    }
  }
  if (alphaVaries) return { img, src: null };
  for (let i = 0; i < d.length; i += 4) {
    d[i + 3] = Math.max(d[i], d[i + 1], d[i + 2]);
  }
  ctx.putImageData(pixels, 0, 0);
  const src = canvas.toDataURL("image/png");
  return { img: await loadMaskImage(src), src };
}

interface UseSamAutofindParams {
  originalRef: RefObject<HTMLCanvasElement | null>;
  surface: SurfaceId;
  quad: Pt[];
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  shellFloor: Pt[] | null;
  setShellFloor: Dispatch<SetStateAction<Pt[] | null>>;
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
  runSam: (point: Pt) => Promise<boolean>;
  armSam: () => void;
  clearSam: () => void;
} {
  const {
    originalRef,
    surface,
    quad,
    setQuad,
    shellFloor,
    setShellFloor,
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

  /* The shell floor rides the same latest-ref discipline: the derivation
     gate must read the floor as it is when the mask lands, not as it was
     at the tap. */
  const shellFloorRef = useRef(shellFloor);
  useEffect(() => {
    shellFloorRef.current = shellFloor;
  }, [shellFloor]);

  /* The learned auto-find (beta, opt-in). Arm it, then one tap sends the
     untouched photo and the tapped point to the segment endpoint; the mask
     that comes back clips the mosaic to the exact surface shape. A cold
     model answers with a ticket instead, and the hook polls quietly until
     the mask is ready. Any miss falls back to the corners, so the desk is
     never stuck. Metered on the server. */
  /* samBusy is state for the UI. Two taps inside one render window both
     read it as false, so the ref is the guard: set synchronously on
     entry, cleared in the finally. */
  const inFlightRef = useRef(false);

  /* Resolves true only after the mask is in state and the snapshot is
     saved, so the guided session can await one surface before moving to
     the next. */
  const runSam = async (point: Pt): Promise<boolean> => {
    const orig = originalRef.current;
    if (!orig || inFlightRef.current) {
      setSamBeta(false);
      return false;
    }
    inFlightRef.current = true;
    setSamBusy(true);
    buzz(4);
    try {
      const shot = canvasToJpeg(orig, 768);
      if (!shot) throw new Error("no-ctx");
      /* One call covers both moods: a warm model answers with the mask
         in the POST, a cold one hands back a ticket and the helper
         polls the free endpoint while samBusy holds the stage. */
      const data = await submitAndAwaitMask(
        JSON.stringify({
          image: shot.base64,
          mediaType: "image/jpeg",
          x: Math.round(point.x * shot.width),
          y: Math.round(point.y * shot.height),
        }),
        () => setSnapMessage("Still looking. The finder is waking."),
      );
      if (data.ok && typeof data.mask === "string") {
        let maskSrc: string = data.mask;
        let img = await loadMaskImage(maskSrc);
        /* Normalise by what the pixels say, not the maskKind tag, once,
           here, before any state sees the mask. */
        const ensured = await ensureAlphaMask(img);
        img = ensured.img;
        if (ensured.src) maskSrc = ensured.src;
        setSamMask(img);
        setSamMaskSrc(maskSrc);
        seedMask(maskSrc, img);
        setHasFittedSurface(true);
        let fittedQuad = quadRef.current;
        let fittedFloor: Pt[] | null = null;
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
              /* A pool already wearing its shell gets one more read: the
                 photo's interior creases place the basin floor. The luma
                 comes off the untouched photo at the mask's own grid, so
                 mask, luma, and rim share one pixel space. Null keeps
                 the floor the visitor has. */
              if (surface === "pool" && shellFloorRef.current) {
                const lc = document.createElement("canvas");
                lc.width = mw;
                lc.height = mh;
                const lx = lc.getContext("2d");
                if (lx) {
                  lx.drawImage(orig, 0, 0, mw, mh);
                  const ld = lx.getImageData(0, 0, mw, mh).data;
                  const luma = new Uint8Array(mw * mh);
                  for (let i = 0; i < luma.length; i += 1) {
                    luma[i] = Math.max(ld[i * 4], ld[i * 4 + 1], ld[i * 4 + 2]);
                  }
                  const rimPx = result.quad.map((p) => ({ x: p.x * mw, y: p.y * mh }));
                  const derived = deriveShellFloor({ data: bits, width: mw, height: mh }, luma, rimPx);
                  if (derived) {
                    fittedFloor = derived;
                    setShellFloor(derived);
                    message = "Shell fitted. Nudge any stone.";
                  }
                }
              }
            }
          }
        } catch {
          /* leave the current corners; the mask still clips the shape */
        }
        /* Save the AI result the moment it lands, so a re-find, a clear,
           or a fresh tap can never lose the segment we paid for. */
        pushSnapshot("AI find", {
          samMask: img,
          samMaskSrc: maskSrc,
          quad: fittedQuad,
          hasFittedSurface: true,
          ...(fittedFloor ? { shellFloor: fittedFloor } : {}),
        });
        setSnapMessage(message);
        buzz(8);
        track("viz_sam", { ok: true });
        return true;
      } else {
        setSnapMessage(data.message ?? "Could not find it there. Drag the corners instead.");
        track("viz_sam", { ok: false });
      }
    } catch (err) {
      if (err instanceof Error && err.message === "mask-decode") {
        setSnapMessage("Could not read the surface. Drag the corners instead.");
      } else if (err instanceof Error && (err.message === "finder-timeout" || err.message === "finder-failed")) {
        setSnapMessage("Could not reach the finder. Drag the corners instead.");
      } else {
        setSnapMessage("Auto-find is busy. Drag the corners instead.");
      }
    } finally {
      inFlightRef.current = false;
      setSamBusy(false);
      setSamBeta(false);
    }
    return false;
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
