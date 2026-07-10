"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Pt, ShellFaceId, SurfaceId, FaceMask } from "../types";
import { buzz, canvasToJpeg } from "../helpers";
import { fitMask } from "../fit";
import { deriveShellFloor, floorTrapezoidFromMask, wallTrapezoidFromMask } from "../shellFit";
import { seedMask } from "../maskCache";
import type { VizSnapshot } from "./useSnapshots";

/* A plain word per shell face for the finder's running message. */
const FACE_WORD: Record<ShellFaceId, string> = {
  back: "back wall",
  left: "left wall",
  right: "right wall",
  near: "near wall",
  floor: "floor",
};

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

/* One paid round trip for one point: send the untouched photo and the
   point, bring back the segment as an alpha-true mask image plus its
   data URI. Throws on any miss, so a per-face loop can skip a face the
   finder could not read and carry on. The single-surface finder keeps
   its own inline copy with its own per-outcome messaging. */
async function segmentAtPoint(
  orig: HTMLCanvasElement,
  point: Pt,
  notifyWaking: () => void,
): Promise<{ img: HTMLImageElement; maskSrc: string }> {
  const shot = canvasToJpeg(orig, 768);
  if (!shot) throw new Error("no-ctx");
  const data = await submitAndAwaitMask(
    JSON.stringify({
      image: shot.base64,
      mediaType: "image/jpeg",
      x: Math.round(point.x * shot.width),
      y: Math.round(point.y * shot.height),
    }),
    notifyWaking,
  );
  if (!(data.ok && typeof data.mask === "string")) throw new Error("finder-failed");
  let maskSrc: string = data.mask;
  let img = await loadMaskImage(maskSrc);
  const ensured = await ensureAlphaMask(img);
  img = ensured.img;
  if (ensured.src) maskSrc = ensured.src;
  return { img, maskSrc };
}

/* Downscale a decoded mask to a small grid and threshold its alpha into
   the bit mask the geometry engine reads. Null when the canvas will not
   paint. */
function maskToBits(img: HTMLImageElement, long = 192): { data: Uint8Array; width: number; height: number } | null {
  if (!(img.naturalWidth > 0 && img.naturalHeight > 0)) return null;
  const longest = Math.max(1, img.naturalWidth, img.naturalHeight);
  const down = Math.min(1, long / longest);
  const mw = Math.max(1, Math.round(img.naturalWidth * down));
  const mh = Math.max(1, Math.round(img.naturalHeight * down));
  const mc = document.createElement("canvas");
  mc.width = mw;
  mc.height = mh;
  const mx = mc.getContext("2d");
  if (!mx) return null;
  mx.drawImage(img, 0, 0, mw, mh);
  const d = mx.getImageData(0, 0, mw, mh).data;
  const bits = new Uint8Array(mw * mh);
  for (let i = 0; i < bits.length; i += 1) if (d[i * 4 + 3] > 12) bits[i] = 1;
  return { data: bits, width: mw, height: mh };
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
  faceMasks: Partial<Record<ShellFaceId, FaceMask>> | null;
  setFaceMasks: Dispatch<SetStateAction<Partial<Record<ShellFaceId, FaceMask>> | null>>;
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
  runShellFaces: (faces: { id: ShellFaceId; point: Pt }[]) => Promise<boolean>;
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
    faceMasks,
    setFaceMasks,
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

  /* The per-face loop accumulates onto whatever faces the active layer
     already carries, so a second run tops up rather than wipes; the ref
     keeps the latest committed set under the many awaits. */
  const faceMasksRef = useRef(faceMasks);
  useEffect(() => {
    faceMasksRef.current = faceMasks;
  }, [faceMasks]);

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

  /* The no-tap shell walk. Given one point per visible basin face (from
     the scene scan), send them one at a time and paint each face in as
     its own segment lands, so the visitor watches the basin fill wall by
     wall with no tap. A face the finder cannot read is skipped, not
     fatal. The floor's mask also sets the basin floor, so the walls that
     share its far corners recede with it. One snapshot at the end holds
     every face for undo. Resolves true if at least one face landed. */
  const runShellFaces = async (faces: { id: ShellFaceId; point: Pt }[]): Promise<boolean> => {
    const orig = originalRef.current;
    if (!orig || inFlightRef.current || faces.length === 0) return false;
    inFlightRef.current = true;
    setSamBusy(true);
    buzz(4);
    const found: Partial<Record<ShellFaceId, FaceMask>> = { ...(faceMasksRef.current ?? {}) };
    let landed = 0;
    let fittedFloor: Pt[] | null = null;
    try {
      for (const face of faces) {
        setSnapMessage(`Fitting the ${FACE_WORD[face.id]}.`);
        try {
          const { img, maskSrc } = await segmentAtPoint(orig, face.point, () =>
            setSnapMessage("Still looking. The finder is waking."));
          const bits = maskToBits(img);
          let faceQuad: Pt[] | undefined;
          if (face.id === "floor") {
            /* The floor's own mask sets the basin floor as a clean
               receding trapezoid (top and bottom extents joined), so the
               tiles cover the whole floor in true perspective and the
               walls that share its far corners recede with it. A thin or
               ambiguous mask declines and the geometric floor stands.
               (fitMask's floor regime skewed this plane into a degenerate
               fan, so the extent read is used instead.) The floor rides
               the shell floor, not a per-face quad. */
            const derived = bits ? floorTrapezoidFromMask(bits) : null;
            if (derived) fittedFloor = derived;
          } else {
            /* A wall's shared-vertex geometry is a thin sliver that
               cannot cover a real receding wall, so the wall carries its
               own fitted quad from the mask's column extents (tall near,
               short far). fitMask's Hough regime flattened the wall into
               an axis-aligned box that streaked under the gloss, so the
               extent read is used instead. A degenerate read is dropped
               and the wall stays bare rather than streaked. */
            const wall = bits ? wallTrapezoidFromMask(bits) : null;
            if (wall) faceQuad = wall;
          }
          found[face.id] = { src: maskSrc, quad: faceQuad };
          seedMask(maskSrc, img);
          landed += 1;
          /* Commit this face the moment it lands: the render folds the
             live faceMasks onto the active layer, so the basin fills one
             face at a time. */
          setFaceMasks({ ...found });
          if (fittedFloor) setShellFloor(fittedFloor);
        } catch {
          /* one unreadable face is not the whole shell; carry on */
        }
      }
      if (landed > 0) {
        setHasFittedSurface(true);
        pushSnapshot("Shell faces", {
          faceMasks: { ...found },
          hasFittedSurface: true,
          ...(fittedFloor ? { shellFloor: fittedFloor } : {}),
        });
        setSnapMessage(
          landed === faces.length
            ? "Shell tiled, face by face. Nudge any stone to refine."
            : `Tiled ${landed} of ${faces.length} faces. Nudge any stone, or tap a face to add it.`,
        );
        buzz(8);
        track("viz_shell_faces", { landed, asked: faces.length });
        return true;
      }
      setSnapMessage("Could not read the shell. Drag the corners instead.");
      return false;
    } finally {
      inFlightRef.current = false;
      setSamBusy(false);
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

  return { samBeta, samBusy, runSam, runShellFaces, armSam, clearSam };
}
