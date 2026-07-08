"use client";

import type { SurfaceId } from "../types";
import { CONTEXTS } from "../constants";

interface Props {
  onLoad: (id: SurfaceId) => void;
}

export default function ContextOptions({ onLoad }: Props) {
  return (
    <div className="mt-7">
      <p className="eyebrow">Start from</p>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 py-2 sm:-mx-2 sm:px-2">
        {CONTEXTS.map((context) => (
          <button
            key={context.id}
            onClick={() => onLoad(context.id)}
            className="shrink-0 rounded-full bg-shell/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-dusk transition-all duration-300 hover:bg-shell/60 active:scale-95"
          >
            {context.label}
          </button>
        ))}
      </div>
    </div>
  );
}
