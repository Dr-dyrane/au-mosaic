"use client";

import { startTransition, useActionState, useOptimistic, useState } from "react";
import { attachEnquiry, setEnquiryStatus, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* One fresh enquiry, two quiet answers: replied, or close it. The
   row clears the instant he taps, the server confirms behind it,
   and on failure the enquiry walks back with a sentence. Attach
   gives a window tap a name, so the funnel can count people. The
   conversation itself lives in WhatsApp; this only clears the desk. */

const select =
  "min-w-0 rounded-full bg-shell/60 px-4 py-2 text-[13px] text-ink outline-none focus:bg-shell transition-colors duration-300";

export default function EnquiryRow({
  id,
  line,
  when,
  attached,
  people,
}: {
  id: string;
  line: string;
  when: string;
  attached?: string;
  people: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setEnquiryStatus, null);
  const [tieState, tieAction, tiePending] = useActionState<SaveState, FormData>(attachEnquiry, null);
  const [open, setOpen] = useState(false);
  const [cleared, clearNow] = useOptimistic<"replied" | "closed" | null, "replied" | "closed">(
    null,
    (_c, v) => v
  );

  /* A successful tie closes the picker by derivation; the revalidated
     row carries the name from then on and the button itself leaves. */
  const showPicker = open && !attached && !tieState?.ok;

  const submit = (form: FormData) => {
    startTransition(() => {
      clearNow(form.get("to") as "replied" | "closed");
      action(form);
    });
  };

  if (cleared) {
    return (
      <p className="py-3 text-[13px] text-dusk" role="status">
        {cleared === "replied" ? "Marked replied." : "Closed."}
      </p>
    );
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] text-ink">{line}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-mist">
            {when}
            {attached && <span className="text-dusk"> · {attached}</span>}
          </p>
        </div>
        <form action={submit} className="flex shrink-0 items-center gap-5">
          <input type="hidden" name="id" value={id} />
          {!attached && people.length > 0 && (
            <button
              type="button"
              onClick={() => {
                buzz(3);
                setOpen(!open);
              }}
              aria-expanded={open}
              data-tour="tie"
              className="link-hair text-mist text-[12px]"
            >
              Attach
            </button>
          )}
          <button
            type="submit"
            name="to"
            value="replied"
            onClick={() => buzz(4)}
            disabled={pending}
            className="link-hair text-dusk text-[12px] disabled:opacity-60"
          >
            Replied
          </button>
          <button
            type="submit"
            name="to"
            value="closed"
            onClick={() => buzz(4)}
            disabled={pending}
            className="link-hair text-mist text-[12px] disabled:opacity-60"
          >
            Close
          </button>
          {state && !state.ok && (
            <p className="text-[12px] text-gold" role="status">
              {state.message}
            </p>
          )}
        </form>
      </div>
      {showPicker && (
        <form
          onSubmit={keepValues(tieAction)}
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="id" value={id} />
          <select name="customerId" required defaultValue="" aria-label="Who is this" className={select}>
            <option value="" disabled>
              Who is this?
            </option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            onClick={() => buzz(4)}
            disabled={tiePending}
            className="link-hair text-dusk text-[12px] disabled:opacity-60"
          >
            {tiePending ? "Tying..." : "Tie them"}
          </button>
          <Sentence state={tieState} />
        </form>
      )}
    </div>
  );
}
