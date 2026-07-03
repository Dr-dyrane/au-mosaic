"use client";

import { useActionState } from "react";
import { addPayment, type SaveState } from "../actions";

/* Money in, balance down. Amounts arrive in naira and are kept in
   kobo, so the arithmetic never loses a coin. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function AddPaymentForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(addPayment, null);

  return (
    <form action={action} className="panel mt-8 grid gap-6">
      <p className="font-serif text-[20px]">Record a payment</p>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className={label}>
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            inputMode="numeric"
            placeholder="250,000"
            aria-label="Amount in naira"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="method" className={label}>
            How it came
          </label>
          <select
            id="method"
            name="method"
            defaultValue="transfer"
            aria-label="Payment method"
            className={field}
          >
            <option value="transfer">Transfer</option>
            <option value="cash">Cash</option>
            <option value="POS">POS</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="paymentNote" className={label}>
          Note, if any
        </label>
        <input
          id="paymentNote"
          name="note"
          aria-label="Payment note"
          placeholder="Who sent it, which bank"
          className={field}
        />
      </div>
      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={pending}
          className="link-hair text-[13px] disabled:opacity-60"
        >
          {pending ? "Recording..." : "Record the payment"}
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
