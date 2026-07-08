"use client";

import { IconAdd } from "@/app/admin/(panel)/icons";

interface Props {
  colors: string[];
  onEdit: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

export default function PaletteEditor({ colors, onEdit, onAdd, onRemove }: Props) {
  return (
    <div className="mt-5" data-viz="palette">
      <p className="eyebrow">Your colours</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-mist">
        Tap a tile to change it, or add your own. Choose a stock colourway above to reset.
      </p>
      <div className="mt-3 flex flex-wrap items-start gap-3">
        {colors.map((c, i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={c}
              onChange={(e) => onEdit(i, e.target.value)}
              aria-label={`Colour ${i + 1}`}
              className="color-dot h-11 w-12 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove colour ${i + 1}`}
              className="text-[11px] text-mist transition-colors duration-300 hover:text-ink"
            >
              remove
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex h-11 w-12 items-center justify-center rounded-[10px] bg-shell/60 text-dusk transition-colors duration-300 hover:bg-shell hover:text-ink"
          aria-label="Add a colour"
        >
          <IconAdd className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
