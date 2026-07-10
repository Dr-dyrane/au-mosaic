"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* One depth map: a normalised grayscale buffer and its size. */
export type DepthMap = { data: Uint8Array; width: number; height: number };

/* Paint a depth map over a stage canvas as a grayscale ramp: near
   bright, far dark. Drawn small then scaled up, a read-only diagnostic
   that leaves no layer touched. */
export function paintDepthMap(canvas: HTMLCanvasElement, map: DepthMap): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const small = document.createElement("canvas");
  small.width = map.width;
  small.height = map.height;
  const sctx = small.getContext("2d");
  if (!sctx) return;
  const img = sctx.createImageData(map.width, map.height);
  for (let i = 0; i < map.width * map.height; i += 1) {
    const v = map.data[i];
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
}

type WorkerMessage =
  | { type: "result"; id: number; data: Uint8Array; width: number; height: number }
  | { type: "error"; id: number };

/* Inference size. The model reads a small image happily and the ~1s
   cost climbs fast with pixels, so cap the long edge before sending. */
const MAX_EDGE = 512;

/* Owns the depth worker: born on first run, terminated on unmount.
   runDepth downscales the photo, runs one pass in the worker, and hands
   back a normalised depth map, or null on any failure so render never
   sees a throw. The last result is memoised by the photo element's own
   identity, so re-running on the same photo returns at once. */
export function useDepth(): {
  runDepth: (photo: HTMLImageElement) => Promise<DepthMap | null>;
  depthBusy: boolean;
} {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, (map: DepthMap | null) => void>>(new Map());
  const cacheRef = useRef<WeakMap<HTMLImageElement, DepthMap>>(new WeakMap());
  const idRef = useRef(0);
  const [depthBusy, setDepthBusy] = useState(false);

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pending.forEach((resolve) => resolve(null));
      pending.clear();
    };
  }, []);

  const ensureWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    try {
      const worker = new Worker(new URL("../depth.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        const resolve = pendingRef.current.get(msg.id);
        if (!resolve) return;
        pendingRef.current.delete(msg.id);
        resolve(msg.type === "result" ? { data: msg.data, width: msg.width, height: msg.height } : null);
      };
      worker.onerror = () => {
        pendingRef.current.forEach((resolve) => resolve(null));
        pendingRef.current.clear();
      };
      workerRef.current = worker;
      return worker;
    } catch {
      return null;
    }
  }, []);

  const runDepth = useCallback(
    async (photo: HTMLImageElement): Promise<DepthMap | null> => {
      const cached = cacheRef.current.get(photo);
      if (cached) return cached;

      const sourceW = photo.naturalWidth;
      const sourceH = photo.naturalHeight;
      if (!sourceW || !sourceH) return null;

      const worker = ensureWorker();
      if (!worker) return null;

      setDepthBusy(true);
      try {
        const scale = Math.min(1, MAX_EDGE / Math.max(sourceW, sourceH));
        const w = Math.max(1, Math.round(sourceW * scale));
        const h = Math.max(1, Math.round(sourceH * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(photo, 0, 0, w, h);
        const pixels = ctx.getImageData(0, 0, w, h);

        const id = (idRef.current += 1);
        const map = await new Promise<DepthMap | null>((resolve) => {
          pendingRef.current.set(id, resolve);
          worker.postMessage(
            { id, image: { data: pixels.data, width: w, height: h } },
            [pixels.data.buffer],
          );
        });
        if (map) cacheRef.current.set(photo, map);
        return map;
      } catch {
        return null;
      } finally {
        setDepthBusy(false);
      }
    },
    [ensureWorker],
  );

  return { runDepth, depthBusy };
}
