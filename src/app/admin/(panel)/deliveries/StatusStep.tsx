"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { setDeliveryStatus, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { buzz } from "@/lib/backoffice";

/* One link, one step forward. Optimistic like the order chips: the
   step reads as taken the instant he taps, the server confirms
   behind it, and on failure the link walks back with a sentence.
   The action still reads the true status from the database, so a
   stale screen cannot push a delivery two steps down the road. */

type Props = { id: string; to: "out" | "delivered"; label: string };

const TAKEN: Record<Props["to"], string> = {
  out: "On the road.",
  delivered: "Landed.",
};

export default function StatusStep({ id, to, label }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setDeliveryStatus, null);
  const [stepped, stepNow] = useOptimistic<boolean, boolean>(false, (_c, v) => v);

  const submit = (form: FormData) => {
    startTransition(() => {
      stepNow(true);
      action(form);
    });
  };

  return (
    <form action={submit} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      {stepped ? (
        <p className="text-[14px] text-dusk" role="status">
          {TAKEN[to]}
        </p>
      ) : (
        <>
          <button type="submit" onClick={() => buzz(5)} disabled={pending} className="link-hair text-[12px] disabled:opacity-60">
            {label}
          </button>
          <Sentence state={state} />
        </>
      )}
    </form>
  );
}
