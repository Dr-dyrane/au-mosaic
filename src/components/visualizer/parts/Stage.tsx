"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, KeyboardEvent, PointerEvent, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import { IconEye } from "../icons";
import type { FitStatus, Pt } from "../types";
import { CORNER_LABELS, SHELL_CORNER_LABELS } from "../constants";
import { buzz } from "../helpers";

/* The stage: canvas, the brass stones and their lines, the loupe, the
   compare chip, the preview toggle, and the finder veil. Presentation
   only; every value and handler arrives from the orchestrator, which
   still owns the state the render pipeline reads. */
interface StageProps {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  loupeRef: RefObject<HTMLCanvasElement | null>;
  draggingRef: RefObject<number | null>;
  dragPoint: RefObject<Pt | null>;
  tick: number;
  quad: Pt[];
  shellFloor: Pt[] | null;
  holding: boolean;
  loupe: Pt | null;
  setLoupe: Dispatch<SetStateAction<Pt | null>>;
  previewMode: boolean;
  fitStatus: FitStatus;
  onAdjust: () => void;
  onAccept: () => void;
  onRetry: () => void;
  onDone: () => void;
  samBeta: boolean;
  samBusy: boolean;
  pointerPos: (e: PointerEvent) => Pt;
  runSam: (point: Pt) => Promise<boolean>;
  holdStart: (e: PointerEvent) => void;
  queueCornerDrag: (index: number, point: Pt) => void;
  finishDrag: () => void;
  drawLoupe: (p: Pt) => void;
  onCornerKey: (index: number, e: KeyboardEvent<SVGCircleElement>) => void;
}

export default function Stage({
  wrapRef,
  canvasRef,
  loupeRef,
  draggingRef,
  dragPoint,
  tick,
  quad,
  shellFloor,
  holding,
  loupe,
  setLoupe,
  previewMode,
  fitStatus,
  onAdjust,
  onAccept,
  onRetry,
  onDone,
  samBeta,
  samBusy,
  pointerPos,
  runSam,
  holdStart,
  queueCornerDrag,
  finishDrag,
  drawLoupe,
  onCornerKey,
}: StageProps) {
  const confirmationRef = useRef<HTMLButtonElement>(null);
  const firstHandleRef = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (fitStatus === "suggested") confirmationRef.current?.focus();
  }, [fitStatus]);
  const startAdjusting = () => {
    onAdjust();
    requestAnimationFrame(() => firstHandleRef.current?.focus());
  };
  const handleOpacity = fitStatus === "suggested" ? 0.55 : 0.9;

  return (
    <div
      ref={wrapRef}
      className="relative -mx-5 w-[calc(100%+2.5rem)] min-w-0 overflow-hidden rounded-none sm:mx-0 sm:w-full sm:max-w-full sm:rounded-[26px]"
    >
      <canvas ref={canvasRef} className="block h-auto w-full max-w-full" />
      <div key={tick} className="viz-sweep pointer-events-none absolute inset-0" aria-hidden />
      <p id="viz-corner-help" className="sr-only">
        Focus a brass corner and use the arrow keys to nudge the surface. Hold shift for a larger move.
      </p>
      {!previewMode && fitStatus !== "finding" && (
      <svg
        className={`absolute inset-0 h-full w-full touch-none ${samBeta ? "cursor-crosshair" : ""}`}
        aria-describedby="viz-corner-help"
        onPointerDown={(e) => { if (samBeta) { runSam(pointerPos(e)); } else { holdStart(e); } }}
        onPointerMove={(e) => {
          if (draggingRef.current === null) return;
          const p = pointerPos(e);
          queueCornerDrag(draggingRef.current, p);
        }}
        onPointerUp={finishDrag}
        onPointerLeave={finishDrag}
      >
        {quad.map((p, i) => {
          const n = quad[(i + 1) % 4];
          return (
            <line
              key={i}
              x1={`${p.x * 100}%`}
              y1={`${p.y * 100}%`}
              x2={`${n.x * 100}%`}
              y2={`${n.y * 100}%`}
              stroke="var(--t-brass)"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity={holding ? 0 : handleOpacity}
            />
          );
        })}
        {shellFloor && shellFloor.map((p, i) => {
          const n = shellFloor[(i + 1) % 4];
          return (
            <line
              key={`fl${i}`}
              x1={`${p.x * 100}%`}
              y1={`${p.y * 100}%`}
              x2={`${n.x * 100}%`}
              y2={`${n.y * 100}%`}
              stroke="var(--t-brass)"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity={holding ? 0 : 0.9}
            />
          );
        })}
        {/* The wall edges, rim stone down to its floor stone, quieter so
            the box reads without shouting. */}
        {shellFloor && shellFloor.map((p, i) => (
          <line
            key={`w${i}`}
            x1={`${quad[i].x * 100}%`}
            y1={`${quad[i].y * 100}%`}
            x2={`${p.x * 100}%`}
            y2={`${p.y * 100}%`}
            stroke="var(--t-brass)"
            strokeWidth="2"
            strokeDasharray="6 5"
            opacity={holding ? 0 : 0.6}
          />
        ))}
        {quad.map((p, i) => (
          <circle
            key={`c${i}`}
            cx={`${p.x * 100}%`}
            cy={`${p.y * 100}%`}
            ref={i === 0 ? firstHandleRef : undefined}
            r="22"
            tabIndex={0}
            role="button"
            aria-label={`${CORNER_LABELS[i]} surface corner. Use arrow keys to nudge.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            fill="var(--t-brass)"
            fillOpacity={holding ? 0 : handleOpacity}
            stroke="#14110b"
            strokeWidth="2"
            style={{ cursor: "grab" }}
            onFocus={() => {
              setLoupe(p);
              requestAnimationFrame(() => drawLoupe(p));
            }}
            onBlur={() => setLoupe(null)}
            onKeyDown={(e) => onCornerKey(i, e)}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              draggingRef.current = i;
              const p2 = pointerPos(e);
              dragPoint.current = p2;
              buzz(6);
              setLoupe(p2);
              requestAnimationFrame(() => drawLoupe(p2));
              onAdjust();
              track("viz_adjust", { corner: i });
            }}
          />
        ))}
        {shellFloor && shellFloor.map((p, i) => (
          <circle
            key={`fc${i}`}
            cx={`${p.x * 100}%`}
            cy={`${p.y * 100}%`}
            r="22"
            tabIndex={0}
            role="button"
            aria-label={`${SHELL_CORNER_LABELS[i]} surface corner. Use arrow keys to nudge.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            fill="var(--t-brass)"
            fillOpacity={holding ? 0 : handleOpacity}
            stroke="#14110b"
            strokeWidth="2"
            style={{ cursor: "grab" }}
            onFocus={() => {
              setLoupe(p);
              requestAnimationFrame(() => drawLoupe(p));
            }}
            onBlur={() => setLoupe(null)}
            onKeyDown={(e) => onCornerKey(4 + i, e)}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              draggingRef.current = 4 + i;
              const p2 = pointerPos(e);
              dragPoint.current = p2;
              buzz(6);
              setLoupe(p2);
              requestAnimationFrame(() => drawLoupe(p2));
              onAdjust();
              track("viz_adjust", { corner: 4 + i });
            }}
          />
        ))}
      </svg>
      )}
      {loupe && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `calc(${loupe.x * 100}% - 60px)`,
            top: `calc(${loupe.y * 100}% - 150px)`,
          }}
        >
          <canvas
            ref={loupeRef}
            className="rounded-full"
            style={{ boxShadow: "0 0 0 2px var(--t-brass), 0 14px 40px -12px rgb(0 0 0 / 0.6)" }}
          />
        </div>
      )}
      {holding && <span className="chip-glass absolute left-1/2 top-4 -translate-x-1/2">Original</span>}
      {!holding && fitStatus === "accepted" && (
        <button
          type="button"
          onClick={startAdjusting}
          aria-pressed={previewMode}
          aria-label="Adjust the accepted fit"
          className="chip-glass absolute right-4 top-4 z-20 font-semibold"
        >
          <IconEye open={false} className="h-3.5 w-3.5" />
          Adjust
        </button>
      )}
      {samBusy && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-sand/45 backdrop-blur-[6px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="relative flex h-12 w-12 items-center justify-center" aria-hidden>
            <span className="absolute h-12 w-12 animate-ping rounded-full bg-gold/25 motion-reduce:animate-none" />
            <span className="h-11 w-11 animate-spin rounded-full border-2 border-gold/25 border-t-gold motion-reduce:animate-none" />
            <span className="absolute h-2 w-2 rounded-full bg-gold" />
          </span>
          <span className="chip-glass text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
            Reading the surface
          </span>
        </div>
      )}
      {!samBusy && fitStatus === "suggested" && (
        <div className="panel absolute inset-x-3 bottom-3 z-20 mx-auto max-w-xl px-4 py-4 sm:inset-x-6 sm:px-5">
          <p className="font-serif text-[20px] text-ink">Does this match the surface?</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button ref={confirmationRef} type="button" onClick={onAccept} className="btn-gold min-h-11">
              Looks right
            </button>
            <button type="button" onClick={startAdjusting} className="min-h-11 rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink">
              Adjust
            </button>
            <button type="button" onClick={onRetry} className="min-h-11 rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-dusk">
              Try again
            </button>
          </div>
        </div>
      )}
      {!samBusy && fitStatus === "adjusting" && (
        <div className="chip-glass absolute bottom-3 left-1/2 z-20 flex w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-4 px-4 py-3">
          <span className="text-[14px] text-ink">Drag the points to match the surface.</span>
          <button type="button" onClick={onDone} className="btn-gold min-h-11 shrink-0">Done</button>
        </div>
      )}
    </div>
  );
}
