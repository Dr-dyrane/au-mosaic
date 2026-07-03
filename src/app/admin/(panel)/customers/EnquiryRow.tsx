"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { setEnquiryStatus, type SaveState } from "./actions";
import { buzz } from "@/lib/backoffice";

/* One fresh enquiry, two quiet answers: replied, or close it. The
   row clears the instant he taps, the server confirms behind it,
   and on failure the enquiry walks back with a sentence. The
   conversation itself lives in WhatsApp; this only clears the desk. */

export default function EnquiryRow({
  id,
  line,
  when,
}: {
  id: string;
  line: string;
  when: string;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setEnquiryStatus, null);
  const [cleared, clearNow] = useOptimistic<"replied" | "closed" | null, "replied" | "closed">(
    null,
    (_c, v) => v
  );

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
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-[14px] text-ink">{line}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-mist">{when}</p>
      </div>
      <form action={submit} className="flex shrink-0 items-center gap-5">
        <input type="hidden" name="id" value={id} />
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
  );
}
