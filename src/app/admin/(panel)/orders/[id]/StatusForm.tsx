"use client";

import { startTransition, useActionState, useOptimistic, useState } from "react";
import AdminSheet from "@/components/AdminSheet";
import { setStatus, type SaveState } from "../actions";
import { PIPELINE, STATUS_LABEL, type OrderStatus as Step } from "../pipeline";
import Sentence from "../../Sentence";
import { buzz } from "@/lib/backoffice";

/* The one lever on the record: where the order stands. Optimistic on
   purpose: the chip moves the instant he saves, the server confirms
   behind it, and on failure the chip walks back with a sentence. The
   save whispers in link-hair; the gold on this page belongs to the
   lines, where the money is.

   One exception earns a pause. Crossing the door, into Delivered or
   Settled or back out of them, physically moves stock, so the house
   asks first with the exact movement named, every line, quantity and
   unit. Gold proceeds, Not yet stays, and the chip does not move
   until he says yes. Confirms are for consequence, never ceremony:
   steps that move nothing still move in one tap. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";

type Movement = { name: string; qty: number; unit: string };

const OUT: readonly Step[] = ["delivered", "settled"];

function Consequence({
  next,
  taking,
  movements,
  onGo,
  onStay,
}: {
  next: Step;
  taking: boolean;
  movements: Movement[];
  onGo: () => void;
  onStay: () => void;
}) {
  const question =
    next === "settled" ? "Settle it?" : next === "delivered" ? "Deliver it?" : "Move it back?";
  const verb =
    next === "settled" ? "Settle it" : next === "delivered" ? "Deliver it" : "Move it back";
  const one = movements.length === 1 ? movements[0] : null;
  const sentence = one
    ? taking
      ? `This takes ${one.qty} ${one.unit} of ${one.name} off the shelf. ${question}`
      : `This returns ${one.qty} ${one.unit} of ${one.name} to the shelf. ${question}`
    : taking
      ? "This takes off the shelf:"
      : "This returns to the shelf:";

  return (
    <AdminSheet
      open
      onOpenChange={(open) => {
        if (!open) onStay();
      }}
      title="Before it moves"
      description={sentence}
      id="order-status-consequence"
      compactOnly={false}
      role="alertdialog"
    >
      {!one && (
        <>
          <ul className="mt-3 grid gap-1.5">
            {movements.map((m, d) => (
              <li key={d} className="text-[14px] text-ink">
                {m.qty} {m.unit} of {m.name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] text-dusk">{question}</p>
        </>
      )}
      <div className="mt-5 flex items-center gap-6">
        <button onClick={onGo} className="btn-gold">
          {verb}
        </button>
        <button onClick={onStay} className="link-hair text-dusk text-[12px]">
          Not yet
        </button>
      </div>
    </AdminSheet>
  );
}

export default function StatusForm({
  orderId,
  status,
  movements,
}: {
  orderId: string;
  status: Step;
  movements: Movement[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setStatus, null);
  const [shown, showNow] = useOptimistic<Step, Step>(status, (_current, next) => next);
  const [ask, setAsk] = useState<{ next: Step; form: FormData } | null>(null);

  /* The optimistic move happens only here, after any question has
     been answered; submitting through a transition keeps the typed
     values if the server says no. */
  const run = (form: FormData) => {
    startTransition(() => {
      showNow(form.get("status") as Step);
      action(form);
    });
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = form.get("status") as Step;
    const crosses = OUT.includes(next) !== OUT.includes(status);
    if (crosses && movements.length > 0) {
      buzz(3);
      setAsk({ next, form });
      return;
    }
    run(form);
  };

  return (
    <div data-tour="order-status">
      {/* The pipeline: the chip under his thumb moves immediately. */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PIPELINE.map((step) => (
          <span key={step} className={`chip-solid ${step === shown ? "is-on" : ""}`}>
            {STATUS_LABEL[step]}
          </span>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:max-w-xs">
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
            onClick={() => buzz(5)}
            className="link-hair text-[12px] disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save the step"}
          </button>
          <Sentence state={state} />
        </div>
      </form>
      {ask && (
        <Consequence
          next={ask.next}
          taking={OUT.includes(ask.next)}
          movements={movements}
          onGo={() => {
            const form = ask.form;
            setAsk(null);
            buzz(6);
            run(form);
          }}
          onStay={() => setAsk(null)}
        />
      )}
    </div>
  );
}
