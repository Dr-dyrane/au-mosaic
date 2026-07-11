"use client";

/* The client-side lane to SAM2, run entirely in the browser on WebGPU.
   It moves the fal cold start (70 to 97s) and per-tap latency off the
   server: encode the photo once, then every tap decodes in a Web Worker
   (sam/sam2.worker.ts) under the visitor's own GPU. The reply is the same
   shape the fal segment route hands back, so runSam swaps only the
   transport and everything after "if (data.ok && typeof data.mask ===
   'string')" stays as it is.

   Two things keep the app never worse than today. First, this whole path
   is gated: it needs a WebGPU browser AND an explicit opt-in flag (env or
   localStorage), and the flag is OFF by default, so a plain visitor never
   touches it and the fal path stays the floor. Second, nothing here runs
   during SSR: the capability read, the worker, and every canvas touch are
   client-only, guarded by typeof checks. When the gate is closed, no
   worker is registered, so clientSam.ready is false and runSam takes fal.

   Two exports serve two readers. The module singleton `clientSam` and
   `clientSamAvailable` are what runSam imports and reads inside an async
   callback (not during render), so a plain object suits it. The
   `useClientSam` hook is what the orchestrator mounts once: it owns the
   worker's whole life, encodes on photo load, pre-warms, and registers a
   live bridge into the singleton so the two readers see one truth. Until
   the hook is mounted the bridge stays null, which is exactly today. */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import type { Pt } from "../types";

/* The reply contract: the same fields the segment endpoint returns, ok
   included, so runSam's `if (data.ok && ...)` gate accepts it unchanged. */
export type ClientSamResult = {
  ok: true;
  mask: string;
  maskKind: "alpha" | "luma";
  width: number;
  height: number;
};

/* The worker protocol, mirrored from sam/sam2.worker.ts so the two hands
   cannot drift. The worker also posts an "info" message with the export's
   real I/O names right before "ready"; the bridge ignores it. */
export type ClientSamRequest =
  | { type: "load" }
  | { type: "encode"; id: number; rgba: Uint8ClampedArray; w: number; h: number }
  | { type: "segment"; id: number; nx: number; ny: number; label: 0 | 1 };

export type ClientSamResponse =
  | { type: "ready" }
  | { type: "encoded"; id?: number }
  | {
      type: "mask";
      id?: number;
      mask: string;
      width: number;
      height: number;
      maskKind: "alpha" | "luma";
    }
  | { type: "error"; id?: number; message?: string };

export type UseClientSamParams = {
  /* The untouched photo, drawn to a canvas by the orchestrator. The
     encode reads its pixels so mask space matches the fal path's. */
  originalRef: RefObject<HTMLCanvasElement | null>;
  /* Changes identity when a new photo lands, which is the cue to encode
     once and pre-warm. Null means no photo, so nothing is ready. */
  photo: HTMLImageElement | null;
};

export type ClientSam = {
  available: boolean;
  ready: boolean;
  segment: (point: Pt) => Promise<ClientSamResult>;
};

/* The longest side the encode carries. The worker squashes whatever it
   gets to a 1024 square for the model and emits the mask back at these
   dimensions, so an aspect-preserving cap keeps the mask true to the
   photo while the transfer stays small. */
const ENCODE_MAX = 1024;

/* A throwaway decode id, never registered as a pending segment, so its
   mask reply is ignored. It exists only to pay the decoder's one-time
   shader compile up front, so the first real tap feels instant. */
const PREWARM_ID = -1;

const ENV_FLAG = process.env.NEXT_PUBLIC_VIZ_CLIENT_SAM;
const LS_KEY = "viz:client-sam";

function truthyFlag(value: string | null | undefined): boolean {
  return value === "1" || value === "on" || value === "true";
}

/* The opt-in, off by default. The env flag sets the build-wide default,
   localStorage lets a tester flip it on one device. Either one on means
   on. SSR reads false, since window is absent there. */
function flagEnabled(): boolean {
  if (truthyFlag(ENV_FLAG)) return true;
  if (typeof window === "undefined") return false;
  try {
    return truthyFlag(window.localStorage.getItem(LS_KEY));
  } catch {
    return false;
  }
}

/* The gate: a WebGPU browser and the opt-in, both required. Any SSR
   context, any browser without navigator.gpu, or the flag left off, all
   read false, so the caller keeps the fal path. */
export function clientSamAvailable(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("gpu" in navigator)) return false;
  return flagEnabled();
}

/* The live bridge the mounted hook publishes. runSam reads it through the
   singleton below; until a hook mounts and the worker is warm, it is
   null, so clientSam.ready is false and the fal path carries every tap. */
type SamBridge = {
  ready: () => boolean;
  segment: (point: Pt) => Promise<ClientSamResult>;
};

let bridge: SamBridge | null = null;

function registerClientSam(next: SamBridge | null): void {
  bridge = next;
}

/* The seam runSam reads. ready is true only when the gate is open and the
   worker has encoded a photo; segment defers to the live bridge and
   rejects if called while dark, a state ready already forecloses. */
export const clientSam = {
  get ready(): boolean {
    return clientSamAvailable() && bridge !== null && bridge.ready();
  },
  segment(point: Pt): Promise<ClientSamResult> {
    if (!bridge) return Promise.reject(new Error("client-sam-unavailable"));
    return bridge.segment(point);
  },
};

/* The capability never changes across a session, so the external store
   has nothing to publish; subscribe is a stable no-op. The server reads
   false and the client reads the real gate, which keeps hydration honest
   without a setState inside an effect. */
const subscribeCapability = (): (() => void) => () => {};
const serverCapability = (): boolean => false;

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/* Prefer the loaded image element: it is this render's own photo, so the
   encode can never race a canvas the parent has not redrawn yet. Fall
   back to the untouched-photo canvas. Scale so the longest side is at
   most ENCODE_MAX, preserving aspect. Returns null when there is nothing
   to read yet, or when the canvas is tainted and pixels are off limits. */
function readEncodeRgba(
  originalRef: RefObject<HTMLCanvasElement | null>,
  photo: HTMLImageElement | null,
): { rgba: Uint8ClampedArray; w: number; h: number } | null {
  if (typeof document === "undefined") return null;
  const canvas = originalRef.current;
  const source: HTMLCanvasElement | HTMLImageElement | null =
    photo && photo.naturalWidth > 0 && photo.naturalHeight > 0
      ? photo
      : canvas && canvas.width > 0 && canvas.height > 0
        ? canvas
        : null;
  if (!source) return null;
  const sw = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth;
  const sh = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight;
  const long = Math.max(sw, sh);
  const scale = long > ENCODE_MAX ? ENCODE_MAX / long : 1;
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const scratch = document.createElement("canvas");
  scratch.width = w;
  scratch.height = h;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(source, 0, 0, w, h);
    return { rgba: ctx.getImageData(0, 0, w, h).data, w, h };
  } catch {
    return null;
  }
}

function post(worker: Worker, message: ClientSamRequest, transfer?: Transferable[]): void {
  if (transfer && transfer.length > 0) worker.postMessage(message, transfer);
  else worker.postMessage(message);
}

/* Spawn the SAM2 worker. onnxruntime-web is installed, so the specifier is
   a plain static literal: Turbopack needs that exact AST shape to compile
   the worker into its own chunk, out of the main bundle. A runtime-built
   specifier emits no chunk, so the worker would 404 the moment the gate
   opened. The gate is OFF by default, so this never runs today. */
function spawnWorker(): Worker {
  return new Worker(new URL("../sam/sam2.worker.ts", import.meta.url), { type: "module" });
}

/* The bridge. Owns the worker's whole life: spawn when the gate opens,
   load the graphs, encode once per photo, pre-warm, decode per tap, and
   tear it all down on unmount. All mutable reads go through refs, so the
   worker binding never re-creates and a stale reply never wins. Mount it
   once in the orchestrator with the untouched-photo ref and the current
   photo; it registers the live bridge the singleton `clientSam` reads. */
export function useClientSam(params: UseClientSamParams): ClientSam {
  const { originalRef, photo } = params;

  /* The gate as external state: false on the server, the real read on the
     client, no effect and no hydration mismatch. */
  const available = useSyncExternalStore(subscribeCapability, clientSamAvailable, serverCapability);
  const [ready, setReady] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const loadedRef = useRef(false);
  const photoRef = useRef<HTMLImageElement | null>(photo);
  const readyRef = useRef(false);

  /* Monotonic encode tickets: only the latest encode's "encoded" reply
     may flip ready, so a photo swap mid-encode cannot mark the wrong
     plane ready. */
  const encodeSeqRef = useRef(0);
  const activeEncodeRef = useRef(0);

  /* Per-tap tickets and the promises waiting on them, keyed by id. */
  const segSeqRef = useRef(0);
  const pendingRef = useRef(
    new Map<number, { resolve: (r: ClientSamResult) => void; reject: (e: Error) => void }>(),
  );

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  /* When the worker and a photo are both here, drop ready and encode
     once. Called on every photo change and again the moment the graphs
     finish loading, so whichever lands last still triggers one encode. A
     change with nothing to encode yet leaves ready untouched; the very
     next encode drops it, and the ready guard on segment holds the line
     until "encoded" lands, so no tap ever decodes a stale embedding. */
  const refreshEncode = useCallback(() => {
    const worker = workerRef.current;
    if (!worker || !loadedRef.current) return;
    const frame = readEncodeRgba(originalRef, photoRef.current);
    if (!frame) return;
    setReady(false);
    const id = encodeSeqRef.current + 1;
    encodeSeqRef.current = id;
    activeEncodeRef.current = id;
    post(worker, { type: "encode", id, rgba: frame.rgba, w: frame.w, h: frame.h }, [
      frame.rgba.buffer as ArrayBuffer,
    ]);
  }, [originalRef]);

  const prewarm = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    post(worker, { type: "segment", id: PREWARM_ID, nx: 0.5, ny: 0.5, label: 1 });
  }, []);

  const onMessage = useCallback(
    (message: ClientSamResponse) => {
      switch (message.type) {
        case "ready":
          loadedRef.current = true;
          /* Encode the photo we already have, if any; otherwise refresh
             does nothing and the photo effect encodes once one lands. */
          refreshEncode();
          break;
        case "encoded":
          if (message.id === activeEncodeRef.current) {
            setReady(true);
            prewarm();
          }
          break;
        case "mask": {
          if (typeof message.id !== "number") break;
          const entry = pendingRef.current.get(message.id);
          if (!entry) break;
          pendingRef.current.delete(message.id);
          entry.resolve({
            ok: true,
            mask: message.mask,
            maskKind: message.maskKind,
            width: message.width,
            height: message.height,
          });
          break;
        }
        case "error": {
          if (typeof message.id === "number") {
            const entry = pendingRef.current.get(message.id);
            if (entry) {
              pendingRef.current.delete(message.id);
              entry.reject(new Error(message.message ?? "client-sam-error"));
            }
          }
          break;
        }
      }
    },
    [refreshEncode, prewarm],
  );

  const onError = useCallback(() => {
    loadedRef.current = false;
    setReady(false);
    pendingRef.current.forEach((entry) => entry.reject(new Error("client-sam-worker-error")));
    pendingRef.current.clear();
  }, []);

  /* Latest-ref for the worker's own handlers, so the spawn effect binds
     once and never re-creates the worker as these closures change. */
  const messageRef = useRef(onMessage);
  const errorRef = useRef(onError);
  useEffect(() => {
    messageRef.current = onMessage;
    errorRef.current = onError;
  }, [onMessage, onError]);

  /* Spawn and load once the gate is open; terminate and reject any
     waiters on unmount or when the gate closes. A worker that will not
     construct leaves ready false, and the caller keeps the fal path. */
  useEffect(() => {
    if (!available || typeof window === "undefined") return;
    const pending = pendingRef.current;
    let worker: Worker;
    try {
      worker = spawnWorker();
    } catch {
      return;
    }
    workerRef.current = worker;
    worker.onmessage = (ev: MessageEvent) => messageRef.current(ev.data as ClientSamResponse);
    worker.onerror = () => errorRef.current();
    post(worker, { type: "load" });
    return () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      loadedRef.current = false;
      activeEncodeRef.current = 0;
      setReady(false);
      pending.forEach((entry) => entry.reject(new Error("client-sam-closed")));
      pending.clear();
    };
  }, [available]);

  /* Encode once per photo. When the worker is not loaded yet, refresh
     does nothing and the ready handler encodes as soon as it is. */
  useEffect(() => {
    photoRef.current = photo;
    refreshEncode();
  }, [photo, refreshEncode]);

  /* One tap, one decode. Rejects when the lane is not ready so the caller
     can take the fal path; the tap rides in as a 0..1 fraction. */
  const segment = useCallback((point: Pt): Promise<ClientSamResult> => {
    const worker = workerRef.current;
    if (!worker || !readyRef.current) {
      return Promise.reject(new Error("client-sam-not-ready"));
    }
    const id = segSeqRef.current + 1;
    segSeqRef.current = id;
    const nx = clamp01(point.x);
    const ny = clamp01(point.y);
    return new Promise<ClientSamResult>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      try {
        post(worker, { type: "segment", id, nx, ny, label: 1 });
      } catch (err) {
        pendingRef.current.delete(id);
        reject(err instanceof Error ? err : new Error("client-sam-post"));
      }
    });
  }, []);

  /* Publish the live bridge for the singleton `clientSam` runSam reads.
     One stable object, its methods reading the hook's own refs, torn down
     on unmount so a stale bridge never outlives the worker. */
  useEffect(() => {
    const live: SamBridge = { ready: () => readyRef.current, segment };
    registerClientSam(live);
    return () => {
      if (bridge === live) registerClientSam(null);
    };
  }, [segment]);

  return { available, ready, segment };
}
