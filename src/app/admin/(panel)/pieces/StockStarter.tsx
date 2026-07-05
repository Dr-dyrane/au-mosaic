"use client";

import { useActionState } from "react";
import { stockTheShelves, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* One tap and the empty shop becomes a shop: believable counts on
   every untouched shelf, his to correct. The room's gold stays with
   New piece; this whispers, because it happens once. */

export default function StockStarter() {
  const [state, action, pending] = useActionState<SaveState, FormData>(stockTheShelves, null);

  return (
    <form onSubmit={keepValues(action)} className="mt-4 flex flex-wrap items-center gap-5">
      <button
        type="submit"
        onClick={() => buzz(5)}
        disabled={pending}
        className="link-hair text-dusk text-[12px] disabled:opacity-60"
      >
        {pending ? "Loading the shelves..." : "Load starting counts"}
      </button>
      <Sentence state={state} />
    </form>
  );
}
