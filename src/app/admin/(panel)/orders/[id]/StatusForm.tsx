"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { setStatus, type SaveState } from "../actions";
import { PIPELINE, STATUS_LABEL, type OrderStatus as Step } from "../pipeline";

/* The one lever on the record: where the order stands. Optimistic on
   purpose: the chip moves the instant he saves, the server confirms
   behind it, and on failure the chip walks back with a sentence. The
   save whispers in link-hair; the gold on this page belongs to the
   lines, where the money is. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";

export default function StatusForm({ orderId, status }: { orderId: string; status: Step }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setStatus, null);
  const [shown, showNow] = useOptimistic<Step, Step>(status, (_current, next) => next);

  const submit = (form: FormData) => {
    startTransition(() => {
      showNow(form.get("status") as Step);
      action(form);
    });
  };

  return (
    <div>
      {/* The pipeline: the chip under his thumb moves immediately. */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PIPELINE.map((step) => (
          <span key={step} className={`chip-solid ${step === shown ? "is-on" : ""}`}>
            {STATUS_LABEL[step]}
          </span>
        ))}
      </div>
      <form action={submit} className="mt-6 grid gap-4 sm:max-w-xs">
        <input type="hidden" name="id" value={orderId} />
        <div>
          <label htmlFor="status" className="eyebrow mb-2.5 block">
            Move it to
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            aria-label="Order status"
            className={field}
          >
            {PIPELINE.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="submit"
            disabled={pending}
            className="link-hair text-[13px] disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save the step"}
          </button>
          {state && (
            <p className={`text-[13px] ${state.ok ? "text-dusk" : "text-gold"}`} role="status">
              {state.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
