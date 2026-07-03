"use client";

import { useActionState } from "react";
import { setDeliveryStatus, type SaveState } from "./actions";

/* One link, one step forward. The action reads the true status from
   the database before it moves anything, so a stale screen cannot
   push a delivery two steps down the road. */

type Props = { id: string; to: "out" | "delivered"; label: string };

export default function StatusStep({ id, to, label }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setDeliveryStatus, null);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <button type="submit" disabled={pending} className="link-hair text-[13px] disabled:opacity-60">
        {pending ? "Moving..." : label}
      </button>
      {state && (
        <p className={`text-[13px] ${state.ok ? "text-dusk" : "text-gold"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
