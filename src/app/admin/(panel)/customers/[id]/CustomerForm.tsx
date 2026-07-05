"use client";

import { useActionState } from "react";
import { saveCustomer, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";

/* The same fields he met on the way in, one Save. The action answers
   in a sentence and the record above stays fresh. A failure never
   eats what he typed. */

type Props = {
  customer: { id: string; name: string; phone: string; area: string; note: string };
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function CustomerForm({ customer }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveCustomer, null);

  return (
    <form onSubmit={keepValues(action)} className="mt-4 grid gap-8">
      <input type="hidden" name="id" value={customer.id} />

      <div className="panel grid gap-6">
        <div>
          <label htmlFor="name" className={label}>Name</label>
          <input
            id="name"
            name="name"
            defaultValue={customer.name}
            required
            aria-label="Name"
            className={field}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={customer.phone}
              placeholder="0803 555 0100"
              aria-label="Phone"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="area" className={label}>Area</label>
            <input
              id="area"
              name="area"
              defaultValue={customer.area}
              aria-label="Area"
              className={field}
            />
          </div>
        </div>
        <div>
          <label htmlFor="note" className={label}>Note</label>
          <textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={customer.note}
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
        <Sentence state={state} />
      </div>
    </form>
  );
}
