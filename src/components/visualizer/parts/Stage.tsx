"use client";

import type { Dispatch, KeyboardEvent, PointerEvent, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import { IconEye } from "../icons";
import type { Pt } from "../types";
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
  togglePreview: () => void;
  samBeta: boolean;
  samBusy: boolean;
  hasFittedSurface: boolean;
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
  togglePreview,
  samBeta,
  samBusy,
  hasFittedSurface,
  pointerPos,
  runSam,
  holdStart,
  queueCornerDrag,
  finishDrag,
  drawLoupe,
  onCornerKey,
}: StageProps) {
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
      {!previewMode && (
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
              opacity={holding ? 0 : 0.9}
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
            r="14"
            tabIndex={hasFittedSurface ? 0 : -1}
            role="button"
            aria-label={`${CORNER_LABELS[i]} surface corner. Use arrow keys to nudge.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            fill="var(--t-brass)"
            fillOpacity={holding ? 0 : 0.9}
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
              track("viz_adjust", { corner: i });
            }}
          />
        ))}
        {shellFloor && shellFloor.map((p, i) => (
          <circle
            key={`fc${i}`}
            cx={`${p.x * 100}%`}
            cy={`${p.y * 100}%`}
            r="14"
            tabIndex={hasFittedSurface ? 0 : -1}
            role="button"
            aria-label={`${SHELL_CORNER_LABELS[i]} surface corner. Use arrow keys to nudge.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            fill="var(--t-brass)"
            fillOpacity={holding ? 0 : 0.9}
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
      {!holding && (
        <button
          type="button"
          onClick={togglePreview}
          aria-pressed={previewMode}
          aria-label={previewMode ? "Show the drag controls" : "Hide the drag controls to preview"}
          className="chip-glass absolute right-4 top-4 z-20 font-semibold"
        >
          <IconEye open={!previewMode} className="h-3.5 w-3.5" />
          {previewMode ? "Adjust" : "Preview"}
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
            <span className="absolute h-12 w-12 animate-ping rounded-full bg-gold/25" />
            <span className="h-11 w-11 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
            <span className="absolute h-2 w-2 rounded-full bg-gold" />
          </span>
          <span className="chip-glass text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
            Reading the surface
          </span>
        </div>
      )}
    </div>
  );
}
