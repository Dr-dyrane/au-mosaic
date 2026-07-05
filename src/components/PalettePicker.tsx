"use client";

import { useSyncExternalStore } from "react";
import { subscribeTheme, getPalette, setPalette, PALETTES, type Palette } from "@/lib/theme-store";

/* Six houses, one quiet row of stones in the footer. Royal leads, the
   owner's own brand; Oba answers it in Yoruba. Each swatch shows its
   palette's night sand and accent; the active one glows. */

const SWATCH: Record<Palette, { sand: string; accent: string; label: string }> = {
  royal: { sand: "#071022", accent: "#7fb3e8", label: "Royal" },
  oba: { sand: "#181109", accent: "#eabf52", label: "Oba" },
  maison: { sand: "#0c0b09", accent: "#c2a15c", label: "Maison" },
  lagoon: { sand: "#071618", accent: "#63cfbf", label: "Lagoon" },
  terracotta: { sand: "#150c08", accent: "#d99a6c", label: "Terracotta" },
  onyx: { sand: "#0b0b0c", accent: "#c9c4b8", label: "Onyx" },
};

export default function PalettePicker() {
  const active = useSyncExternalStore(subscribeTheme, getPalette, () => "maison" as Palette);

  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label="Colour palette">
      {PALETTES.map((p) => {
        const s = SWATCH[p];
        const isActive = active === p;
        return (
          <button
            key={p}
            role="radio"
            aria-checked={isActive}
            aria-label={`${s.label} palette`}
            title={s.label}
            onClick={() => setPalette(p)}
            className={`relative h-5 w-5 rounded-full transition-transform duration-300 hover:scale-110 active:scale-95 ${
              isActive ? "scale-110" : ""
            }`}
            style={{
              background: s.sand,
              boxShadow: isActive
                ? `0 0 0 6px color-mix(in srgb, ${s.accent} 18%, transparent), 0 0 24px ${s.accent}88`
                : undefined,
            }}
          >
            <span
              className="absolute inset-[5px] rounded-full"
              style={{ background: s.accent }}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
