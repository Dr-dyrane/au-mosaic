"use client";

import { useActionState } from "react";
import { createRange, saveRange, type SaveState } from "./actions";

/* One form for a shelf, new or old. The address is minted once and
   shown, never edited; the name can change any day. */

type Props = {
  range?: { slug: string; name: string; line: string; family: string; sort: number };
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function RangeForm({ range }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    range ? saveRange : createRange,
    null
  );
  return (
    <form action={action} className="panel mt-10 grid max-w-xl gap-6">
      {range && <input type="hidden" name="slug" value={range.slug} />}
      <div>
        <label htmlFor="name" className={label}>Name</label>
        <input id="name" name="name" defaultValue={range?.name} required aria-label="Range name" className={field} />
      </div>
      <div>
        <label htmlFor="line" className={label}>One line under the name</label>
        <input id="line" name="line" defaultValue={range?.line} aria-label="Range line" className={field} />
      </div>
      <div>
        <label htmlFor="family" className={label}>Which side of the business</label>
        <select id="family" name="family" defaultValue={range?.family ?? "mosaic"} aria-label="Family" className={field}>
          <option value="mosaic">Mosaic</option>
          <option value="pool">Pool materials</option>
        </select>
      </div>
      <div>
        <label htmlFor="sort" className={label}>Position on the shelf (lower comes first)</label>
        <input id="sort" name="sort" type="number" inputMode="numeric" defaultValue={range?.sort ?? 0} aria-label="Sort position" className={field} />
      </div>
      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : range ? "Save the range" : "Create the range"}
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
