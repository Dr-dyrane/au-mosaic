"use client";

import { useActionState, useState } from "react";
import { clearHistory, clearHistoryBefore, type SaveState } from "./history-actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* Clearing the record is a door that only opens on purpose. The first
   tap reveals the consequence and names the count; the gold tap under
   it is the one that empties. A date trims instead of empties. */

export default function ClearHistory({ total }: { total: number }) {
  const [open, setOpen] = useState(false);
  const [clearState, clearAction, clearing] = useActionState<SaveState, FormData>(clearHistory, null);
  const [trimState, trimAction, trimming] = useActionState<SaveState, FormData>(clearHistoryBefore, null);

  if (total <= 0) return null;

  return (
    <div className="panel mt-6 max-w-md">
      <p className="eyebrow">Clear the record</p>
      <p className="mt-2 text-[14px] leading-relaxed text-dusk">
        Empty the whole history for a clean start, or trim everything before a date. This cannot be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="link-hair mt-4 inline-block text-[12px] text-dusk"
        >
          Clear the history
        </button>
      ) : (
        <div className="mt-5 grid gap-5">
          <form onSubmit={keepValues(clearAction)} className="flex flex-wrap items-center gap-5">
            <button
              type="submit"
              onClick={() => buzz(6)}
              disabled={clearing}
              className="btn-gold disabled:opacity-60"
            >
              {clearing ? "Clearing..." : `Empty all ${total.toLocaleString()} lines`}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="link-hair text-[12px] text-dusk"
            >
              Keep it
            </button>
            <Sentence state={clearState} />
          </form>

          <form onSubmit={keepValues(trimAction)} className="flex flex-wrap items-center gap-4">
            <label htmlFor="before" className="text-[12px] text-mist">
              Or clear before
            </label>
            <input
              id="before"
              name="before"
              type="date"
              aria-label="Clear entries before this date"
              className="rounded-[14px] bg-shell/60 px-4 py-2.5 text-[14px] text-ink outline-none focus:bg-shell"
            />
            <button
              type="submit"
              disabled={trimming}
              className="link-hair text-[12px] text-dusk disabled:opacity-60"
            >
              {trimming ? "Trimming..." : "Trim"}
            </button>
            <Sentence state={trimState} />
          </form>
        </div>
      )}
    </div>
  );
}
