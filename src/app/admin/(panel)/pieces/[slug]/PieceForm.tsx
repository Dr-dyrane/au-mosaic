"use client";

import { useActionState, useEffect, useRef } from "react";
import ColorsField from "../ColorsField";
import Sentence from "../../Sentence";
import Teach from "../../Teach";
import { keepValues } from "../../keep";
import { buzz } from "@/lib/backoffice";
import { savePiece, type SaveState } from "../actions";

/* The unsaved guard, both doors: touch the form and the browser asks
   before the tab closes or reloads, and any in-app link asks before
   the router walks. Saving clears it; choosing to leave is respected
   once, not questioned twice. */
function useUnsavedGuard(saved: boolean) {
  const dirty = useRef(false);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    /* Capture phase, so the question lands before the router moves.
       New-tab clicks and modifier clicks keep this page, so they
       pass unasked. */
    const guard = (e: MouseEvent) => {
      if (!dirty.current) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!a || a.getAttribute("target") === "_blank") return;
      if (window.confirm("Leave without saving? The edits on this page will be lost.")) {
        dirty.current = false;
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, []);
  useEffect(() => {
    if (saved) dirty.current = false;
  }, [saved]);
  return () => {
    dirty.current = true;
  };
}

/* One form, one Save. Labels speak shop floor, not database: sheets in
   stock, warn me at, container lands. The colour field previews its
   tiles live, and the save button answers back. */

type Props = {
  piece: {
    slug: string;
    name: string;
    line: string;
    story: string;
    priceNote: string;
    colors: string[];
    unit: string;
    published: boolean;
  };
  stock: { quantitySheets: number; reorderAt: number; containerEta: string | null };
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function PieceForm({ piece, stock }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(savePiece, null);
  const markDirty = useUnsavedGuard(!!state?.ok);

  return (
    <form onSubmit={keepValues(action)} onChange={markDirty} className="grid gap-8">
      <input type="hidden" name="slug" value={piece.slug} />

      <div className="panel grid gap-6" data-tour="words">
        <p className="font-serif text-[20px]">The words</p>
        <div>
          <label htmlFor="name" className={label}>Name</label>
          <input id="name" name="name" defaultValue={piece.name} required className={field} />
        </div>
        <div>
          <label htmlFor="line" className={label}>One line under the name</label>
          <input id="line" name="line" defaultValue={piece.line} className={field} />
        </div>
        <div>
          <label htmlFor="story" className={label}>The longer story (piece page)</label>
          <textarea id="story" name="story" defaultValue={piece.story} rows={4} className={field} />
        </div>
        <div>
          <label htmlFor="priceNote" className={label}>Price note</label>
          <input id="priceNote" name="priceNote" defaultValue={piece.priceNote} placeholder="Quote per job" className={field} />
        </div>
      </div>

      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">The look</p>
        <ColorsField initial={piece.colors ?? []} />
        <label className="flex cursor-pointer items-center justify-between" data-tour="window">
          <span>
            <span className="block text-[15px] font-medium">Show on the site</span>
            <Teach until="stockroom">
              <span className="mt-1 block text-[13px] text-dusk">
                Off means customers cannot see this piece.
              </span>
            </Teach>
          </span>
          <input type="checkbox" name="published" defaultChecked={piece.published} className="h-6 w-6 accent-[#c2a15c]" />
        </label>
      </div>

      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">The stockroom</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div data-tour="stock-count">
            <label htmlFor="quantitySheets" className={label}>In stock</label>
            <input id="quantitySheets" name="quantitySheets" type="number" min={0} inputMode="numeric" defaultValue={stock.quantitySheets} className={field} />
          </div>
          <div data-tour="unit">
            <label htmlFor="unit" className={label}>Counted in</label>
            <input id="unit" name="unit" defaultValue={piece.unit} placeholder="sheets, bags, units" className={field} />
          </div>
          <div data-tour="warn-at">
            <label htmlFor="reorderAt" className={label}>Warn me at</label>
            <input id="reorderAt" name="reorderAt" type="number" min={0} inputMode="numeric" defaultValue={stock.reorderAt} className={field} />
          </div>
          <div data-tour="container">
            <label htmlFor="containerEta" className={label}>Container lands</label>
            <input id="containerEta" name="containerEta" type="date" defaultValue={stock.containerEta ?? ""} className={field} />
          </div>
        </div>
      </div>

      {/* The Save lives under the thumb on a long page: a glass bar
          that rides above the tab bar until the desk takes over. */}
      <div className="glass sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 -mx-2 flex items-center gap-6 rounded-full px-4 py-3 sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-filter-none" data-tour="save">
        <button type="submit" disabled={pending} onClick={() => buzz(5)} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the piece"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
