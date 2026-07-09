"use client";

import { startTransition, useActionState, useState } from "react";
import AdminSheet from "@/components/AdminSheet";
import { foldCustomer, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { buzz } from "@/lib/backoffice";

/* Two cards, one number. The quiet cure for a split ledger: fold the
   twin's records onto this card and archive the twin. The house asks
   first and names exactly what moves; gold carries the verb, Not yet
   stays. Consequence, never ceremony. */

export type Twin = {
  id: string;
  name: string;
  orders: number;
  enquiries: number;
  motions: number;
};

function whatMoves(t: Twin) {
  const parts: string[] = [];
  if (t.orders > 0) parts.push(`${t.orders} ${t.orders === 1 ? "order" : "orders"}`);
  if (t.enquiries > 0)
    parts.push(`${t.enquiries} ${t.enquiries === 1 ? "enquiry" : "enquiries"}`);
  if (t.motions > 0) parts.push(`${t.motions} ${t.motions === 1 ? "motion" : "motions"}`);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export default function FoldTwins({ keepId, twins }: { keepId: string; twins: Twin[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(foldCustomer, null);
  const [ask, setAsk] = useState<Twin | null>(null);

  const go = (twin: Twin) => {
    const form = new FormData();
    form.set("keepId", keepId);
    form.set("foldId", twin.id);
    startTransition(() => action(form));
  };

  return (
    <div className="mt-4 grid gap-3">
      {twins.map((twin) => (
        <div key={twin.id} className="panel">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[14px] text-ink">{twin.name}</p>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                buzz(3);
                setAsk(twin);
              }}
              className="link-hair text-[12px] disabled:opacity-60"
            >
              {pending ? "Folding..." : "Fold onto this card"}
            </button>
          </div>
          {whatMoves(twin) && (
            <p className="mt-2 text-[13px] text-dusk">{whatMoves(twin)} on their card</p>
          )}
        </div>
      ))}
      <Sentence state={state} />
      {ask && (
        <AdminSheet
          open
          onOpenChange={(open) => {
            if (!open) setAsk(null);
          }}
          title="Before they fold"
          description={
            whatMoves(ask)
              ? `This moves ${whatMoves(ask)} from ${ask.name} onto this card, then archives their card. Fold them?`
              : `${ask.name}'s card is empty. This archives it and keeps this one. Fold them?`
          }
          id="customer-fold-consequence"
          compactOnly={false}
          role="alertdialog"
        >
          <div className="mt-5 flex items-center gap-6">
            <button
              onClick={() => {
                const twin = ask;
                setAsk(null);
                buzz(6);
                go(twin);
              }}
              className="btn-gold"
            >
              Fold them
            </button>
            <button onClick={() => setAsk(null)} className="link-hair text-dusk text-[12px]">
              Not yet
            </button>
          </div>
        </AdminSheet>
      )}
    </div>
  );
}
