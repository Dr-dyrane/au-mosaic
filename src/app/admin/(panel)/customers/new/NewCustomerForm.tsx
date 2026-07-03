"use client";

import { useActionState } from "react";
import { createCustomer, type SaveState } from "../actions";

/* One form, one Save. The action answers in a sentence, and on
   success walks him straight into the new record. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function NewCustomerForm() {
  const [state, action, pending] = useActionState<SaveState, FormData>(createCustomer, null);

  return (
    <form action={action} className="mt-10 grid max-w-3xl gap-8">
      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">Who they are</p>
        <div>
          <label htmlFor="name" className={label}>Name</label>
          <input id="name" name="name" required aria-label="Name" className={field} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="0803 555 0100"
              aria-label="Phone"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="area" className={label}>Area</label>
            <input id="area" name="area" placeholder="Lekki" aria-label="Area" className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="note" className={label}>Note</label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="How you met, what they asked for."
            aria-label="Note"
            className={field}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the customer"}
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
