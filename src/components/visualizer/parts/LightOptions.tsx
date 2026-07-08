"use client";

import type { PrepMode } from "../types";

interface Props {
  tileSize: number;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  onTileSize: (value: number) => void;
  onBlend: (value: number) => void;
  onPrepMode: (mode: PrepMode) => void;
  onGroutToggle: () => void;
}

export default function LightOptions({
  tileSize,
  blend,
  prepMode,
  groutLight,
  onTileSize,
  onBlend,
  onPrepMode,
  onGroutToggle,
}: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
      <div className="panel">
        <p className="eyebrow">Tile size</p>
        <input
          type="range"
          min={14}
          max={48}
          value={tileSize}
          onChange={(e) => onTileSize(+e.target.value)}
          className="mt-4 w-full accent-[#c2a15c]"
          aria-label="Tile size"
        />
      </div>
      <div className="panel">
        <p className="eyebrow">Blend with the light</p>
        <input
          type="range"
          min={40}
          max={100}
          value={blend * 100}
          onChange={(e) => onBlend(+e.target.value / 100)}
          className="mt-4 w-full accent-[#c2a15c]"
          aria-label="Blend"
        />
      </div>
      <div className="panel">
        <p className="eyebrow">Prep surface</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["primer", "Primer"],
            ["blur", "Blur"],
            ["none", "Original"],
          ] as Array<[PrepMode, string]>).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={prepMode === mode}
              onClick={() => onPrepMode(mode)}
              className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-300 active:scale-95 ${
                prepMode === mode ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-mist">Primer hides old tile.</p>
      </div>
      <div className="panel flex items-center justify-between gap-4">
        <p className="eyebrow">Grout</p>
        <button
          onClick={onGroutToggle}
          className="link-hair text-dusk"
        >
          {groutLight ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}
