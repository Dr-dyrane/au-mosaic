"use client";

import { useActionState } from "react";
import { setStaffActive, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* One key on the rack: who holds it, and whether it still turns.
   Taking it back never deletes it; the history keeps the name. */

export default function KeyRow({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setStaffActive, null);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-[14px] text-ink">{name}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-mist">
          {active ? "Key turns" : "Key taken back"}
        </p>
      </div>
      <form onSubmit={keepValues(action)} className="flex shrink-0 items-center gap-5">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="to" value={active ? "off" : "on"} />
        <button
          type="submit"
          onClick={() => buzz(4)}
          disabled={pending}
          className="link-hair text-dusk text-[12px] disabled:opacity-60"
        >
          {pending ? "A moment..." : active ? "Take back the key" : "Hand it back"}
        </button>
        {state && !state.ok && <Sentence state={state} />}
      </form>
    </div>
  );
}
