"use client";

import type { BinaryMask } from "./fitMask";
import type { LumaImage } from "./poolRimRefiner";

export type SegmentPayload = {
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

const TICKET = /^[A-Za-z0-9_-]{8,80}$/;

export async function submitAndAwaitMask(
  payload: string,
  notifyWaking: () => void,
  pollIntervalMs = 1500,
  signal?: AbortSignal,
): Promise<SegmentPayload> {
  const submittedAt = Date.now();
  const res = await fetch("/api/visualizer/segment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    signal,
  });
  const data = (await res.json()) as SegmentPayload;
  if (data.ok && data.pending === true && typeof data.id === "string" && TICKET.test(data.id)) {
    try {
      return await pollForMask(data.id, submittedAt, notifyWaking, pollIntervalMs, signal);
    } catch (err) {
      if (err instanceof Error && err.message === "finder-timeout") throw err;
      throw new Error("finder-failed");
    }
  }
  return data;
}

async function pollForMask(
  id: string,
  submittedAt: number,
  notifyWaking: () => void,
  pollIntervalMs: number,
  signal?: AbortSignal,
): Promise<SegmentPayload> {
  let hinted = false;
  while (Date.now() - submittedAt < 110_000) {
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const timer = window.setTimeout(resolve, pollIntervalMs);
      signal?.addEventListener("abort", () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
    if (!hinted && Date.now() - submittedAt > 8000) {
      notifyWaking();
      hinted = true;
    }
    const res = await fetch(`/api/visualizer/segment?id=${encodeURIComponent(id)}`, { signal });
    const data = (await res.json()) as SegmentPayload;
    if (data.ok && data.pending === true) continue;
    if (data.ok && typeof data.mask === "string") return data;
    throw new Error("finder-failed");
  }
  throw new Error("finder-timeout");
}

export function loadMaskImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("mask-decode"));
    img.src = src;
  });
}

/* Everything downstream clips by alpha. If a provider returns an opaque
   black and white image, move its luminance into alpha once at the edge. */
export async function ensureAlphaMask(
  img: HTMLImageElement,
): Promise<{ img: HTMLImageElement; src: string | null }> {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  if (!width || !height) throw new Error("mask-decode");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mask-decode");
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height);
  const rgba = pixels.data;
  const stride = Math.max(1, Math.floor((width * height) / 4096)) * 4;
  let alphaVaries = false;
  for (let i = 3; i < rgba.length; i += stride) {
    if (rgba[i] <= 250) {
      alphaVaries = true;
      break;
    }
  }
  if (alphaVaries) return { img, src: null };
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i + 3] = Math.max(rgba[i], rgba[i + 1], rgba[i + 2]);
  }
  ctx.putImageData(pixels, 0, 0);
  const src = canvas.toDataURL("image/png");
  return { img: await loadMaskImage(src), src };
}

export function maskImageToBinary(img: HTMLImageElement, maxSide = 384): BinaryMask | null {
  if (!img.naturalWidth || !img.naturalHeight) return null;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 1) {
    if (rgba[i * 4 + 3] > 12) data[i] = 1;
  }
  return { data, width, height };
}

export function canvasToLuma(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): LumaImage | null {
  const scratch = document.createElement("canvas");
  scratch.width = width;
  scratch.height = height;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.round(
      rgba[i * 4] * 0.2126 + rgba[i * 4 + 1] * 0.7152 + rgba[i * 4 + 2] * 0.0722,
    );
  }
  return { data, width, height };
}
