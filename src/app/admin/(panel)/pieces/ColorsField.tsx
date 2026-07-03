"use client";

import { useState } from "react";

/* The colours of a piece, chosen by eye, not by code. Each tile opens
   the phone's own colour wheel; Add lays another tile; the little x
   takes one away (form state only, nothing saved until Save). A
   hidden field hands the action the same comma-joined hexes it has
   always read. */

export default function ColorsField({ initial }: { initial: string[] }) {
  const [colors, setColors] = useState<string[]>(initial);

  const update = (i: number, v: string) =>
    setColors((c) => c.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => setColors((c) => c.filter((_, j) => j !== i));
  const add = () => setColors((c) => [...c, "#1179a8"]);

  return (
    <div data-tour="colours">
      <span className="eyebrow mb-2.5 block">Tile colours</span>
      <input type="hidden" name="colors" value={colors.join(", ")} />
      <div className="flex flex-wrap items-start gap-3">
        {colors.map((c, i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={c}
              onChange={(e) => update(i, e.target.value)}
              aria-label={`Colour ${i + 1}`}
              className="color-dot h-11 w-12 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove colour ${i + 1}`}
              className="text-[11px] text-mist transition-colors duration-300 hover:text-ink"
            >
              remove
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex h-11 w-12 items-center justify-center rounded-[10px] bg-shell/60 text-[18px] leading-none text-dusk transition-colors duration-300 hover:bg-shell hover:text-ink"
          aria-label="Add a colour"
        >
          +
        </button>
      </div>
      <p className="mt-2.5 text-[12px] leading-relaxed text-mist">
        Tap a tile to change it. These paint the sheet when there is no
        photograph yet, and the visualizer everywhere.
      </p>
    </div>
  );
}
