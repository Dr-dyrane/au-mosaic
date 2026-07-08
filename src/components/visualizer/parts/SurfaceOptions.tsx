"use client";

import type { SurfaceId } from "../types";
import { SURFACES } from "../constants";

interface Props {
  surface: SurfaceId;
  onFit: (id: SurfaceId) => void;
}

export default function SurfaceOptions({ surface, onFit }: Props) {
  return (
    <div>
      <p className="eyebrow">Surface fit</p>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 py-2 sm:-mx-2 sm:px-2">
        {(Object.entries(SURFACES) as Array<[SurfaceId, (typeof SURFACES)[SurfaceId]]>).map(([id, item]) => (
          <button
            key={id}
            onClick={() => onFit(id)}
            aria-pressed={surface === id}
            className={`shrink-0 rounded-full px-5 py-3 text-left transition-all duration-300 active:scale-95 ${
              surface === id ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
            }`}
          >
            <span className="block text-[12px] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
            <span className="mt-1 block text-[12px] normal-case tracking-normal text-mist">{item.line}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
