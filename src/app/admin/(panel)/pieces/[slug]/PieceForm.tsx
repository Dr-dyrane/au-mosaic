"use client";

import { useActionState } from "react";
import ColorsField from "../ColorsField";
import { savePiece, type SaveState } from "../actions";

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

  return (
    <form action={action} className="mt-10 grid max-w-3xl gap-8">
      <input type="hidden" name="slug" value={piece.slug} />

      <div className="panel grid gap-6">
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
        <label className="flex cursor-pointer items-center justify-between">
          <span>
            <span className="block text-[15px] font-medium">Show on the site</span>
            <span className="mt-1 block text-[13px] text-dusk">
              Off means customers cannot see this piece.
            </span>
          </span>
          <input type="checkbox" name="published" defaultChecked={piece.published} className="h-6 w-6 accent-[#c2a15c]" />
        </label>
      </div>

      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">The stockroom</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="quantitySheets" className={label}>In stock</label>
            <input id="quantitySheets" name="quantitySheets" type="number" min={0} inputMode="numeric" defaultValue={stock.quantitySheets} className={field} />
          </div>
          <div>
            <label htmlFor="unit" className={label}>Counted in</label>
            <input id="unit" name="unit" defaultValue={piece.unit} placeholder="sheets, bags, units" className={field} />
          </div>
          <div>
            <label htmlFor="reorderAt" className={label}>Warn me at</label>
            <input id="reorderAt" name="reorderAt" type="number" min={0} inputMode="numeric" defaultValue={stock.reorderAt} className={field} />
          </div>
          <div>
            <label htmlFor="containerEta" className={label}>Container lands</label>
            <input id="containerEta" name="containerEta" type="date" defaultValue={stock.containerEta ?? ""} className={field} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the piece"}
        </button>
        {state && (
          <p className={`text-[13px] ${state.ok ? "text-dusk" : "text-gold"}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
