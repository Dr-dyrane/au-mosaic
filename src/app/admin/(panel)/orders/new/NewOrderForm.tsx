"use client";

import { useActionState } from "react";
import { createOrder, type SaveState } from "../actions";

/* One select, one Save. The order opens as an enquiry and the page
   turns straight to its record, where the lines go on. */

type Props = { customers: { id: string; name: string }[] };

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function NewOrderForm({ customers }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(createOrder, null);

  return (
    <form action={action} className="mt-10 grid max-w-xl gap-8">
      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">Who is buying</p>
        <div>
          <label htmlFor="customerId" className={label}>
            Customer
          </label>
          <select
            id="customerId"
            name="customerId"
            required
            aria-label="Customer"
            defaultValue=""
            className={field}
          >
            <option value="" disabled>
              Pick a customer
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="note" className={label}>
            Note, if any
          </label>
          <input
            id="note"
            name="note"
            aria-label="Order note"
            placeholder="Site address, timing, anything worth keeping"
            className={field}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the order"}
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
