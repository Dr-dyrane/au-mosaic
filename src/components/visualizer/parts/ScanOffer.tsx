"use client";

import { useState } from "react";
import type { SurfaceId } from "../types";
import type { SessionStep, VisualizerScan } from "../hooks/useSurfaceSession";

interface Props {
  scan: VisualizerScan;
  steps: SessionStep[];
  running: boolean;
  onAccept: (kinds: SurfaceId[]) => void;
  onDismiss: () => void;
}

const STEP_WORDS: Record<SessionStep["state"], string> = {
  pending: "waiting",
  finding: "finding",
  done: "done",
  failed: "not found",
};

/* A surface below this starts unselected: the chip still shows, but
   the customer opts in rather than un-picking a shaky guess. */
const PRESELECT_CONFIDENCE = 0.45;

/* The scan's offer: one glass row above the status line. Confident
   surfaces start selected; a tap sets one aside or brings one in.
   Running, the same row reads out each surface as the finder works
   through it. */
export default function ScanOffer({ scan, steps, running, onAccept, onDismiss }: Props) {
  /* Seeded once per mount: a new photo closes the offer before a new
     scan can open it, so every scan arrives on a fresh mount. A pool
     shell is the hero of its scene: it starts alone so Tile it dresses
     the whole basin, and the deck or a wall is opted into by a tap
     rather than laid over the pool by default. */
  const [selected, setSelected] = useState<SurfaceId[]>(() => {
    const shell = scan.surfaces.find((s) => s.kind === "pool" && s.shape === "shell");
    if (shell) return [shell.kind];
    return scan.surfaces.filter((s) => s.confidence >= PRESELECT_CONFIDENCE).map((s) => s.kind);
  });

  const toggle = (kind: SurfaceId) =>
    setSelected((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));

  const liveStep = steps.find((step) => step.state === "finding");

  return (
    <div className="panel flex flex-col gap-3 !p-5" data-viz="scan-offer">
      <p className="text-[14px] leading-relaxed text-ink">{scan.scene}</p>
      {running ? (
        <>
          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <span
                key={step.kind}
                className={`rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${
                  step.state === "finding" ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk"
                }`}
              >
                {step.state === "done" ? `${step.name} ✓` : `${step.name}, ${STEP_WORDS[step.state]}`}
              </span>
            ))}
          </div>
          {/* Visual only: the stage's snapMessage is the one live
              announcement, so this line stays quiet for readers. */}
          <p className="text-[12px] leading-relaxed text-mist">
            {liveStep ? `Finding ${liveStep.name}.` : "Working through the surfaces."}
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {scan.surfaces.map((surface) => (
              <button
                key={surface.kind}
                type="button"
                aria-pressed={selected.includes(surface.kind)}
                onClick={() => toggle(surface.kind)}
                className={`rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
                  selected.includes(surface.kind) ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
                }`}
              >
                {surface.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onAccept(selected)}
              disabled={selected.length === 0}
              className="btn-gold disabled:opacity-40"
            >
              Tile it
            </button>
            <button type="button" onClick={onDismiss} className="link-hair text-dusk">
              Choose myself
            </button>
          </div>
        </>
      )}
    </div>
  );
}
