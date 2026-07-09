"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, KeyboardEvent, PointerEvent, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { Pt } from "../types";
import { buzz } from "../helpers";
import { clamp, isValidQuad, setCorner } from "../geometry";

interface UseCornerDragParams {
  quad: Pt[];
  setQuad: Dispatch<SetStateAction<Pt[]>>;
  setHasFittedSurface: Dispatch<SetStateAction<boolean>>;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
  render: () => void;
  draggingRef: RefObject<number | null>;
  holdingRef: RefObject<boolean>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  wrapRef: RefObject<HTMLDivElement | null>;
  loupeRef: RefObject<HTMLCanvasElement | null>;
  originalRef: RefObject<HTMLCanvasElement | null>;
}

/* The four-corner drag and the focus loupe, lifted out of the orchestrator
   into their own hook. It owns the drag bookkeeping (which corner is live,
   the queued point, the rAF handle), the loupe position, and the
   press-and-hold compare flags. It does NOT own the quad or the fitted
   surface flag: that control state stays in the orchestrator because the
   render, the snapshots, and the persistence all read it, so the hook
   receives quad and the setters and writes them back. The canvas, wrap,
   loupe, and original refs are handed in, and holdEnd calls the
   orchestrator's render so a released compare repaints the mosaic. */
export function useCornerDrag(params: UseCornerDragParams) {
  const {
    quad,
    setQuad,
    setHasFittedSurface,
    setSnapMessage,
    render,
    draggingRef,
    holdingRef,
    canvasRef,
    wrapRef,
    loupeRef,
    originalRef,
  } = params;

  const [holding, setHolding] = useState(false);
  const [loupe, setLoupe] = useState<Pt | null>(null);
  const dragFrame = useRef<number | null>(null);
  const dragPoint = useRef<Pt | null>(null);

  useEffect(() => () => {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current);
  }, []);

  const pointerPos = (e: PointerEvent): Pt => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98),
      y: clamp((e.clientY - rect.top) / rect.height, 0.02, 0.98),
    };
  };

  const updateCorner = useCallback((index: number, point: Pt) => {
    const safePoint = { x: clamp(point.x, 0.02, 0.98), y: clamp(point.y, 0.02, 0.98) };
    setQuad((current) => {
      const next = setCorner(current, index, safePoint);
      if (isValidQuad(next)) return next;
      return current;
    });
  }, [setQuad]);

  /* The loupe: what your finger is hiding, shown above it at 2.5x. */
  const drawLoupe = (p: Pt) => {
    const src = canvasRef.current;
    const dst = loupeRef.current;
    if (!src || !dst) return;
    const size = 120;
    dst.width = size;
    dst.height = size;
    const zoom = 2.5;
    const sx = p.x * src.width - size / (2 * zoom);
    const sy = p.y * src.height - size / (2 * zoom);
    const ctx = dst.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(src, sx, sy, size / zoom, size / zoom, 0, 0, size, size);
    ctx.strokeStyle = "#c2a15c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - 10);
    ctx.lineTo(size / 2, size / 2 + 10);
    ctx.moveTo(size / 2 - 10, size / 2);
    ctx.lineTo(size / 2 + 10, size / 2);
    ctx.stroke();
  };

  const holdEnd = () => {
    if (!holding) return;
    holdingRef.current = false;
    setHolding(false);
    render();
  };

  const queueCornerDrag = (index: number, point: Pt) => {
    dragPoint.current = point;
    setLoupe(point);
    if (dragFrame.current !== null) return;
    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null;
      const nextPoint = dragPoint.current;
      if (!nextPoint || draggingRef.current !== index) return;
      updateCorner(index, nextPoint);
      drawLoupe(nextPoint);
    });
  };

  const finishDrag = () => {
    if (dragFrame.current !== null) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    if (draggingRef.current !== null && dragPoint.current) {
      updateCorner(draggingRef.current, dragPoint.current);
      setHasFittedSurface(true);
      setSnapMessage("Fit updated. Add another surface when ready.");
    }
    if (draggingRef.current !== null) buzz(4);
    draggingRef.current = null;
    dragPoint.current = null;
    setLoupe(null);
    holdEnd();
  };

  const nudgeCorner = (index: number, dx: number, dy: number) => {
    const current = quad[index];
    const next = { x: clamp(current.x + dx, 0.02, 0.98), y: clamp(current.y + dy, 0.02, 0.98) };
    updateCorner(index, next);
    setHasFittedSurface(true);
    setSnapMessage("Fit updated. Add another surface when ready.");
    setLoupe(next);
    requestAnimationFrame(() => drawLoupe(next));
    buzz(2);
    track("viz_adjust", { corner: index, method: "keyboard" });
  };

  const onCornerKey = (index: number, e: KeyboardEvent<SVGCircleElement>) => {
    const step = e.shiftKey ? 0.04 : 0.012;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    nudgeCorner(index, move[0], move[1]);
  };

  const holdStart = (e: PointerEvent) => {
    if ((e.target as Element).tagName === "circle") return;
    if (!originalRef.current || !canvasRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    buzz(6);
    track("viz_compare", {});
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.drawImage(originalRef.current, 0, 0);
  };

  return {
    dragPoint,
    loupe,
    setLoupe,
    holding,
    pointerPos,
    holdStart,
    holdEnd,
    queueCornerDrag,
    finishDrag,
    nudgeCorner,
    onCornerKey,
    drawLoupe,
  };
}
