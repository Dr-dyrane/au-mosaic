"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStaff, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* A name and a key, handed over in person. The key shows as plain
   text on purpose: he types it while they watch, then it is hashed
   and never seen again. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function AddStaffForm() {
  const [state, action, pending] = useActionState<SaveState, FormData>(addStaff, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} onSubmit={keepValues(action)} className="mt-6 grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="staffName" className={label}>Name</label>
          <input id="staffName" name="name" required aria-label="Staff name" placeholder="Ada" className={field} />
        </div>
        <div>
          <label htmlFor="staffKey" className={label}>Their key (six characters or more)</label>
          <input
            id="staffKey"
            name="key"
            required
            minLength={6}
            autoComplete="off"
            aria-label="Staff key"
            placeholder="Typed once, then hashed"
            className={field}
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={pending}
          onClick={() => buzz(5)}
          className="link-hair text-[13px] disabled:opacity-60"
        >
          {pending ? "Cutting..." : "Cut the key"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
