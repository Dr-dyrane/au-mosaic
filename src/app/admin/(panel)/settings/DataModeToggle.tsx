"use client";

import { useActionState } from "react";
import { setDataMode, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { buzz } from "@/lib/backoffice";

/* Live or demo, the owner's one switch. Live is real business only.
   Demo lays sample customers and orders beside the real ones, so a fresh
   book still looks alive for a walkthrough. Switching writes nothing but
   the mode; the samples are always the demo seed's, tagged and
   removable. The label speaks the move, not the state. */

export default function DataModeToggle({ mode }: { mode: "live" | "demo" }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(setDataMode, null);
  const next = mode === "demo" ? "live" : "demo";

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="to" value={next} />
      <div className="flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={pending}
          onClick={() => buzz(5)}
          aria-pressed={mode === "demo"}
          className="link-hair text-dusk text-[12px] disabled:opacity-60"
        >
          {pending
            ? "A moment..."
            : mode === "demo"
              ? "Switch to live only"
              : "Show demo data too"}
        </button>
        <Sentence state={state} />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-mist">
        {mode === "demo"
          ? "Demo is on. Sample customers and orders show beside your real ones. Nothing sample is real; a banner marks every room."
          : "Live only. Your real business, samples hidden. Turn demo on to show a full book to someone."}
      </p>
    </form>
  );
}
