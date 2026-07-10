"use client";

import type { ReactNode } from "react";
import type { Pt, SurfaceId } from "../types";
import type { VizSnapshot } from "../hooks/useSnapshots";
import {
  IconAutoFind,
  IconClear,
  IconAddSurface,
  IconShell,
  IconRemove,
  IconRefine,
  IconPin,
  IconUndo,
  IconRedo,
} from "../icons";

/* The studio's tool row: the button wall drawn as icons with succinct
   words. Desktop reads it as an inline lucent capsule, the active tool
   gold on currentColor; the phone floats the same set as a glass capsule
   in the thumb zone, icons at rest, the active tool showing its word,
   every full phrase kept in the aria-label. The single loud action, Send,
   is not here: it stays the one gold capsule in the bottom row, so the
   studio never wears two golds. Refine opens the existing bottom-sheet;
   the rail owns none of the surface state, only the handlers it fires. */

interface ToolRailProps {
  armSam: () => void;
  clearSam: () => void;
  samBeta: boolean;
  samBusy: boolean;
  samMaskSrc: string | null;
  addSurfaceLayer: (kind?: SurfaceId) => boolean;
  hasFittedSurface: boolean;
  surface: SurfaceId;
  toggleShell: () => void;
  shellFloor: Pt[] | null;
  removeSurfaceLayer: () => void;
  layersLength: number;
  pinLook: () => void;
  stepHistory: (dir: -1 | 1) => void;
  history: { i: number; snaps: VizSnapshot[] };
  openRefine: () => void;
}

type Tool = {
  key: string;
  icon: ReactNode;
  label: string;
  aria: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

export default function ToolRail({
  armSam,
  clearSam,
  samBeta,
  samBusy,
  samMaskSrc,
  addSurfaceLayer,
  hasFittedSurface,
  surface,
  toggleShell,
  shellFloor,
  removeSurfaceLayer,
  layersLength,
  pinLook,
  stepHistory,
  history,
  openRefine,
}: ToolRailProps) {
  /* One source of truth for both breakpoints. Order is the old wall's:
     find or clear, add, shell, remove, refine, pin. The undo pair
     is drawn on its own below, since it carries a count between arrows. */
  const candidates: (Tool | null)[] = [
    !samMaskSrc && !samBusy
      ? {
          key: "find",
          icon: <IconAutoFind />,
          label: samBeta ? "Tap" : "Find",
          aria: samBeta ? "Tap the wall or floor to find the surface" : "Auto-find the surface",
          onClick: armSam,
          active: samBeta,
        }
      : null,
    samMaskSrc
      ? { key: "clear", icon: <IconClear />, label: "Clear", aria: "Clear auto-find", onClick: clearSam }
      : null,
    hasFittedSurface
      ? { key: "add", icon: <IconAddSurface />, label: "Add", aria: "Add surface", onClick: () => addSurfaceLayer() }
      : null,
    surface === "pool"
      ? {
          key: "shell",
          icon: <IconShell />,
          label: shellFloor ? "Flat" : "Shell",
          aria: shellFloor ? "Lie the surface flat" : "Fold the pool into a shell",
          onClick: toggleShell,
          active: !!shellFloor,
        }
      : null,
    layersLength > 1
      ? { key: "remove", icon: <IconRemove />, label: "Remove", aria: "Remove surface", onClick: removeSurfaceLayer }
      : null,
    { key: "refine", icon: <IconRefine />, label: "Refine", aria: "Refine the surface", onClick: openRefine },
    hasFittedSurface
      ? { key: "pin", icon: <IconPin />, label: "Pin", aria: "Pin this look", onClick: pinLook }
      : null,
  ];
  const tools = candidates.filter((tool): tool is Tool => tool !== null);

  const showHistory = history.snaps.length > 1;
  const atStart = history.i <= 0;
  const atEnd = history.i >= history.snaps.length - 1;

  return (
    <>
      {/* Desktop: an inline lucent capsule, word beside every glyph. */}
      <div className="hidden sm:flex" data-viz="tool-rail">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-shell/45 px-2 py-1.5 shadow-lift">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={tool.onClick}
              disabled={tool.disabled}
              aria-label={tool.aria}
              aria-pressed={tool.active}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 disabled:opacity-40 ${
                tool.active ? "text-gold" : "text-dusk hover:text-ink"
              }`}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
          {showHistory && (
            <span className="ml-1 inline-flex items-center gap-1" role="group" aria-label="Snapshot history">
              <button
                type="button"
                onClick={() => stepHistory(-1)}
                disabled={atStart}
                aria-label="Previous snapshot"
                className="inline-flex items-center rounded-full px-2.5 py-1.5 text-dusk transition-colors duration-300 hover:text-ink disabled:opacity-40"
              >
                <IconUndo />
              </button>
              <span className="text-[12px] tabular-nums text-mist" aria-live="polite">
                {history.i + 1} / {history.snaps.length}
              </span>
              <button
                type="button"
                onClick={() => stepHistory(1)}
                disabled={atEnd}
                aria-label="Next snapshot"
                className="inline-flex items-center rounded-full px-2.5 py-1.5 text-dusk transition-colors duration-300 hover:text-ink disabled:opacity-40"
              >
                <IconRedo />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Phone: the same set floats in the thumb zone, icons at rest, the
          active tool alone speaking its word. Scrolls inside itself if the
          set runs long, so the page body never scrolls sideways. */}
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:hidden">
        <div className="no-scrollbar glass flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full px-2 py-1.5">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={tool.onClick}
              disabled={tool.disabled}
              aria-label={tool.aria}
              aria-pressed={tool.active}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 transition-colors duration-300 disabled:opacity-40 ${
                tool.active ? "text-gold" : "text-ink"
              }`}
            >
              {tool.icon}
              {tool.active && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{tool.label}</span>
              )}
            </button>
          ))}
          {showHistory && (
            <span className="inline-flex shrink-0 items-center gap-1" role="group" aria-label="Snapshot history">
              <button
                type="button"
                onClick={() => stepHistory(-1)}
                disabled={atStart}
                aria-label="Previous snapshot"
                className="inline-flex items-center rounded-full px-2 py-2 text-ink disabled:opacity-40"
              >
                <IconUndo />
              </button>
              <span className="text-[11px] tabular-nums text-mist" aria-live="polite">
                {history.i + 1}/{history.snaps.length}
              </span>
              <button
                type="button"
                onClick={() => stepHistory(1)}
                disabled={atEnd}
                aria-label="Next snapshot"
                className="inline-flex items-center rounded-full px-2 py-2 text-ink disabled:opacity-40"
              >
                <IconRedo />
              </button>
            </span>
          )}
        </div>
      </div>

    </>
  );
}
