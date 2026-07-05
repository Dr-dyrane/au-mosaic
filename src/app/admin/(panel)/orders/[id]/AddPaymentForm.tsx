"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminSheet from "@/components/AdminSheet";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { useAdminSurface } from "@/components/admin-surface-router";
import { addPayment, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";
import { buzz } from "@/lib/backoffice";

/* Money in, balance down. Amounts arrive in naira and are kept in
   kobo, so the arithmetic never loses a coin. A failure keeps what
   he typed; a success clears the desk for the next payment. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function AddPaymentForm({
  orderId,
  surface = "panel",
  idPrefix = "payment",
}: {
  orderId: string;
  surface?: "panel" | "plain";
  idPrefix?: string;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(addPayment, null);
  const ref = useRef<HTMLFormElement>(null);
  const plain = surface === "plain";

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      id={idPrefix}
      ref={ref}
      onSubmit={keepValues(action)}
      className={plain ? "grid gap-6" : "panel mt-8 grid gap-6"}
      data-tour="payment"
    >
      {!plain && <p className="font-serif text-[20px]">Record a payment</p>}
      <input type="hidden" name="orderId" value={orderId} />
      <div className={`grid gap-6 ${plain ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor={`${idPrefix}-amount`} className={label}>
            Amount
          </label>
          <input
            id={`${idPrefix}-amount`}
            name="amount"
            inputMode="numeric"
            placeholder="250,000"
            aria-label="Amount in naira"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-method`} className={label}>
            How it came
          </label>
          <select
            id={`${idPrefix}-method`}
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
        <label htmlFor={`${idPrefix}-note`} className={label}>
          Note, if any
        </label>
        <input
          id={`${idPrefix}-note`}
          name="note"
          aria-label="Payment note"
          placeholder="Who sent it, which bank"
          className={field}
        />
      </div>
      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={pending} onClick={() => buzz(5)}
          className={`${plain ? "btn-gold" : "link-hair text-[12px]"} disabled:opacity-60`}
        >
          {pending ? "Recording..." : "Record the payment"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}

export function OrderPaymentAction({
  orderId,
  showTrigger = false,
  className = "link-hair text-dusk text-[12px]",
}: {
  orderId: string;
  showTrigger?: boolean;
  className?: string;
}) {
  const surface = useAdminSurface(
    { kind: "order-payment", orderId },
    { id: "order-payment", intent: ADMIN_ACTION_INTENTS.orderPayment }
  );

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={surface.openSurface}
          aria-controls={surface.triggerProps["aria-controls"]}
          aria-expanded={surface.triggerProps["aria-expanded"]}
          className={className}
        >
          Record a payment
        </button>
      )}
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="Record a payment"
        description="Add what arrived. The balance keeps itself."
        id="order-payment"
        compactOnly
      >
        <AddPaymentForm orderId={orderId} surface="plain" idPrefix="order-payment-sheet" />
      </AdminSheet>
    </>
  );
}
