"use client";

import { useActionState } from "react";
import { setDataMode, type SaveState } from "./actions";
import Sentence from "../Sentence";
import Teach from "../Teach";
import { buzz } from "@/lib/backoffice";

/* Live or demo, the owner's one switch. Demo is the launch default:
   sample customers and orders sit beside real ones, so a fresh book
   still feels alive for a walkthrough. Switching writes nothing but
   the mode; the samples are always tagged and removable. The label
   speaks the move, not the state. */

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
        {mode === "demo" ? "Demo data is on." : "Live only."}
      </p>
      <Teach>
        <p className="mt-1.5 text-[12px] leading-relaxed text-mist">
          {mode === "demo"
            ? "Demo is the default. Sample customers and orders show beside real ones, with a banner in every room."
            : "Samples stay hidden until you turn demo back on for a walkthrough."}
        </p>
      </Teach>
    </form>
  );
}
