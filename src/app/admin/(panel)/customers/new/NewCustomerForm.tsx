"use client";

import { useActionState, useRef, useState } from "react";
import { createCustomer, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";

/* One form, one Save. The action answers in a sentence, and on
   success walks him straight into the new record. Paste pulls the
   customer's number off the clipboard, cleaned, so a number copied
   in WhatsApp becomes a customer without retyping. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

/* Pull the first Nigerian mobile out of anything pasted, a bare number
   or a whole chat line, and hand it back in the local 0 form. */
function pastedNumber(text: string): string | null {
  const match = text.match(/(?:\+?234|0)[\s\-()]*\d(?:[\s\-()]*\d){8,9}/);
  if (!match) return null;
  let digits = match[0].replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) digits = `0${digits.slice(3)}`;
  return digits;
}

export default function NewCustomerForm({ phone }: { phone?: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(createCustomer, null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState("");

  const paste = async () => {
    setHint("");
    try {
      const text = await navigator.clipboard.readText();
      const number = pastedNumber(text);
      if (number && phoneRef.current) {
        phoneRef.current.value = number;
        phoneRef.current.focus();
        setHint("Number pasted.");
      } else {
        setHint("No number on the clipboard. Type it in.");
      }
    } catch {
      setHint("Long-press the box and paste the number.");
    }
  };

  return (
    <form onSubmit={keepValues(action)} className="mt-10 grid max-w-3xl gap-8">
      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">Who they are</p>
        <div>
          <label htmlFor="name" className={label}>Name</label>
          <input id="name" name="name" required aria-label="Name" className={field} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>Phone</label>
            <div className="flex items-center gap-3">
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={phone}
                ref={phoneRef}
                placeholder="0803 555 0100"
                aria-label="Phone"
                className={field}
              />
              <button
                type="button"
                onClick={paste}
                className="shrink-0 rounded-[16px] bg-shell/60 px-4 py-3.5 text-[13px] font-semibold text-dusk transition-colors duration-300 hover:bg-shell hover:text-ink"
              >
                Paste
              </button>
            </div>
            {hint && <p className="mt-2 text-[12px] text-mist">{hint}</p>}
          </div>
          <div>
            <label htmlFor="area" className={label}>Area</label>
            <input id="area" name="area" placeholder="Lekki" aria-label="Area" className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="note" className={label}>Note</label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="How you met, what they asked for."
            aria-label="Note"
            className={field}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the customer"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
