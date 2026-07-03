"use client";

import { useActionState } from "react";
import { saveSettings, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";

/* The facts of the house, one form. WhatsApp is the bloodstream, so
   its number leads. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveSettings, null);
  return (
    <form onSubmit={keepValues(action)} className="panel mt-10 grid max-w-xl gap-6">
      <div>
        <label htmlFor="whatsapp" className={label}>WhatsApp number (digits, 234...)</label>
        <input id="whatsapp" name="whatsapp" inputMode="numeric" defaultValue={values.whatsapp ?? ""} aria-label="WhatsApp number" className={field} />
      </div>
      <div>
        <label htmlFor="phone_display" className={label}>Phone, as shown to customers</label>
        <input id="phone_display" name="phone_display" defaultValue={values.phone_display ?? ""} aria-label="Phone display" className={field} />
      </div>
      <div>
        <label htmlFor="hours" className={label}>Opening hours</label>
        <input id="hours" name="hours" defaultValue={values.hours ?? ""} aria-label="Opening hours" className={field} />
      </div>
      <div>
        <label htmlFor="location" className={label}>Where the house stands</label>
        <input id="location" name="location" defaultValue={values.location ?? ""} aria-label="Location" className={field} />
      </div>
      <div>
        <label htmlFor="instagram" className={label}>Instagram link</label>
        <input id="instagram" name="instagram" defaultValue={values.instagram ?? ""} aria-label="Instagram link" className={field} />
      </div>
      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the facts"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
