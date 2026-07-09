"use client";

import { startTransition, useActionState, useState } from "react";
import AdminSheet from "@/components/AdminSheet";
import { forgetCustomer, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { buzz } from "@/lib/backoffice";

/* The right to be forgotten, owner only. The consequence card says
   exactly what leaves and what stays, and there is no undo, so the
   ask is plain and the verb is theirs to press. */

export default function ForgetCustomer({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(forgetCustomer, null);
  const [ask, setAsk] = useState(false);

  const go = () => {
    const form = new FormData();
    form.set("id", id);
    startTransition(() => action(form));
  };

  return (
    <div className="mt-10">
      <p className="eyebrow">Their data</p>
      <p className="mt-3 text-[14px] leading-relaxed text-dusk">
        The data law gives {name} the right to be forgotten. The money
        history stays in the book; their person leaves it.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          buzz(3);
          setAsk(true);
        }}
        className="link-hair mt-4 text-[12px] text-dusk disabled:opacity-60"
      >
        {pending ? "Forgetting..." : "Forget this customer"}
      </button>
      <Sentence state={state} />
      {ask && (
        <AdminSheet
          open
          onOpenChange={(open) => {
            if (!open) setAsk(false);
          }}
          title="Before they are forgotten"
          description={`This clears ${name}'s name, number, and words from their card, their enquiries, their deliveries, and their order notes, then archives the card as Forgotten. The amounts, dates, and stock lines stay. There is no undo. Forget them?`}
          id="customer-forget-consequence"
          compactOnly={false}
          role="alertdialog"
        >
          <div className="mt-5 flex items-center gap-6">
            <button
              onClick={() => {
                setAsk(false);
                buzz(6);
                go();
              }}
              className="btn-gold"
            >
              Forget them
            </button>
            <button onClick={() => setAsk(false)} className="link-hair text-dusk text-[12px]">
              Not yet
            </button>
          </div>
        </AdminSheet>
      )}
    </div>
  );
}
