"use client";

import type { SurfaceId, SurfaceLayer } from "../types";
import { LAYER_LABELS } from "../constants";

interface Props {
  layers: SurfaceLayer[];
  activeLayerId: string;
  surface: SurfaceId;
  onSelect: (layer: SurfaceLayer) => void;
}

export default function LayerChips({ layers, activeLayerId, surface, onSelect }: Props) {
  return (
    <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 py-2" data-viz="layer-chips">
      {layers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          aria-pressed={layer.id === activeLayerId}
          onClick={() => onSelect(layer)}
          className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
            layer.id === activeLayerId ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
          }`}
        >
          {layer.id === activeLayerId ? LAYER_LABELS[surface] : layer.label}
        </button>
      ))}
    </div>
  );
}
