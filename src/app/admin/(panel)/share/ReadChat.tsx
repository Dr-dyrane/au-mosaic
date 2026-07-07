"use client";

import { useActionState, useState } from "react";
import { draftFromIntake } from "./draft-actions";
import type { DraftState } from "./draft-types";
import ReviewDraft from "./ReviewDraft";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* The intake. Paste the chat or add the exported file, tap once, and
   the book reads it into a draft. On a wide screen the draft stands
   beside the intake; on the phone it rises as a sheet. The pasted words
   survive a failed read, the house rule for forms. */

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function ReadChat({
  initialText = "",
  matchedCustomer = null,
  suggestedPhone = "",
}: {
  initialText?: string;
  matchedCustomer?: { id: string; name: string } | null;
  suggestedPhone?: string;
}) {
  const [state, action, pending] = useActionState<DraftState, FormData>(draftFromIntake, null);
  const [dismissed, setDismissed] = useState(false);
  const submit = keepValues(action);

  const intake = (
    <form
      onSubmit={(e) => {
        setDismissed(false);
        submit(e);
      }}
      className="panel grid gap-5"
    >
      <div>
        <p className="font-serif text-[20px]">Read a chat</p>
        <p className="mt-2 text-[14px] leading-relaxed text-dusk">
          Paste it, or add the file WhatsApp saved. The book reads what they want; you check it.
        </p>
      </div>
      <div>
        <label htmlFor="chat-text" className={label}>The chat</label>
        <textarea
          id="chat-text"
          name="text"
          rows={6}
          defaultValue={initialText}
          placeholder="Paste the WhatsApp chat here."
          aria-label="The chat"
          className={field}
        />
      </div>
      <div>
        <label htmlFor="chat-file" className={label}>Or the exported file</label>
        <input
          id="chat-file"
          name="chat"
          type="file"
          accept=".txt,.zip,text/plain,application/zip"
          aria-label="Exported chat file"
          className="block w-full text-[13px] text-dusk file:mr-4 file:rounded-full file:border-0 file:bg-shell file:px-4 file:py-2 file:text-[12px] file:text-ink"
        />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <button type="submit" onClick={() => buzz(4)} disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Reading..." : "Read the chat"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );

  if (state?.draft && state.draft.lines.length > 0 && !dismissed) {
    return (
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start xl:gap-8">
        {intake}
        <ReviewDraft
          draft={state.draft}
          matchedCustomer={matchedCustomer}
          suggestedPhone={suggestedPhone}
          onClose={() => setDismissed(true)}
        />
      </div>
    );
  }

  return intake;
}
