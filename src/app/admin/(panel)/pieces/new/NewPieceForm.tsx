"use client";

import { useActionState } from "react";
import ColorsField from "../ColorsField";
import { createPiece, type SaveState } from "../actions";

/* Birth certificate for a piece: a name and a shelf. Everything else
   can wait for the record page. Drafts by default; the window is a
   choice, not an accident. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function NewPieceForm({ ranges }: { ranges: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(createPiece, null);
  return (
    <form action={action} className="panel mt-10 grid max-w-xl gap-6">
      <div>
        <label htmlFor="name" className={label}>Name</label>
        <input id="name" name="name" required aria-label="Piece name" placeholder="Emerald pool blend" className={field} />
      </div>
      <div>
        <label htmlFor="rangeSlug" className={label}>Its shelf</label>
        <select id="rangeSlug" name="rangeSlug" required aria-label="Range" className={field} defaultValue="">
          <option value="" disabled>
            Choose a range
          </option>
          {ranges.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="line" className={label}>One line under the name</label>
        <input id="line" name="line" aria-label="Piece line" className={field} />
      </div>
      <ColorsField initial={[]} />
      <label className="flex cursor-pointer items-center justify-between">
        <span>
          <span className="block text-[15px] font-medium">Put it in the window now</span>
          <span className="mt-1 block text-[13px] text-dusk">
            Off means it stays in the book until you are ready.
          </span>
        </span>
        <input type="checkbox" name="published" className="h-6 w-6 accent-[#c2a15c]" />
      </label>
      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Creating..." : "Create the piece"}
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
