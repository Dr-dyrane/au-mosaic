"use client";

import { useActionState } from "react";
import { keepAsEnquiry, type SaveState } from "./actions";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import { buzz } from "@/lib/backoffice";

/* One tap files the shared chat with the fresh enquiries. */

export default function KeepEnquiry({
  message,
  customerId,
}: {
  message: string;
  customerId: string | null;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(keepAsEnquiry, null);

  return (
    <form onSubmit={keepValues(action)} className="flex flex-wrap items-center gap-5">
      <input type="hidden" name="message" value={message} />
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <button
        type="submit"
        onClick={() => buzz(4)}
        disabled={pending}
        className="link-hair text-dusk text-[13px] disabled:opacity-60"
      >
        {pending ? "Keeping..." : "Keep it as an enquiry"}
      </button>
      <Sentence state={state} />
    </form>
  );
}
