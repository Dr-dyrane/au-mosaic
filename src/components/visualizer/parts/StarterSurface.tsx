"use client";

import type { SurfaceId } from "../types";
import { QUICK_SURFACES, LAYER_LABELS } from "../constants";

interface Props {
  surface: SurfaceId;
  onChoose: (id: SurfaceId) => void;
}

export default function StarterSurface({ surface, onChoose }: Props) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">Surface</p>
      <div className="no-scrollbar -mx-2 mt-3 flex gap-2 overflow-x-auto px-2 py-1">
        {QUICK_SURFACES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={surface === id}
            onClick={() => onChoose(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
              surface === id ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
            }`}
          >
            {LAYER_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
