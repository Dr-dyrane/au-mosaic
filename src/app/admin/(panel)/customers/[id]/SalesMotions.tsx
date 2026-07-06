"use client";

import { useActionState, useEffect, useRef } from "react";
import { buzz } from "@/lib/backoffice";
import { SALES_MOTIONS, salesMotionLabel } from "@/lib/sales-motions";
import AdminSheet from "@/components/AdminSheet";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { useAdminSurface } from "@/components/admin-surface-router";
import { addSalesMotion, setSalesMotionStatus, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";

type Motion = {
  id: string;
  kind: string;
  status: string;
  note: string;
  scheduledFor: string | null;
  completedAt: Date | string | null;
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

type AddMotionFormProps = {
  customerId: string;
  surface?: "panel" | "plain";
  idPrefix?: string;
};

function fmtDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AddMotionForm({
  customerId,
  surface = "panel",
  idPrefix = "motion",
}: AddMotionFormProps) {
  const [addState, addAction, addPending] = useActionState<SaveState, FormData>(addSalesMotion, null);
  const formRef = useRef<HTMLFormElement>(null);
  const plain = surface === "plain";

  useEffect(() => {
    if (addState?.ok) formRef.current?.reset();
  }, [addState]);

  return (
    <form
      ref={formRef}
      onSubmit={keepValues(addAction)}
      className={plain ? "grid gap-5" : "panel mt-4 grid gap-5"}
    >
      <input type="hidden" name="customerId" value={customerId} />
      <div className={`grid gap-5 ${plain ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor={`${idPrefix}-kind`} className={label}>Motion</label>
          <select
            id={`${idPrefix}-kind`}
            name="kind"
            className={field}
            defaultValue="sample_pictures"
          >
            {SALES_MOTIONS.map((motion) => (
              <option key={motion.key} value={motion.key}>
                {motion.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-date`} className={label}>Date</label>
          <input
            id={`${idPrefix}-date`}
            name="scheduledFor"
            type="date"
            className={field}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-note`} className={label}>Note</label>
        <textarea
          id={`${idPrefix}-note`}
          name="note"
          rows={2}
          placeholder="What needs to happen next."
          className={field}
        />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={addPending}
          onClick={() => buzz(4)}
          className={`${plain ? "btn-gold" : "link-hair text-dusk text-[12px]"} disabled:opacity-60`}
        >
          {addPending ? "Adding..." : "Add motion"}
        </button>
        <Sentence state={addState} />
      </div>
    </form>
  );
}

export function CustomerMotionAction({ customerId }: { customerId: string }) {
  const surface = useAdminSurface(
    { kind: "customer-motion", customerId },
    { id: "customer-motion", intent: ADMIN_ACTION_INTENTS.customerMotion }
  );

  return (
    <AdminSheet
      open={surface.sheetOpen}
      onOpenChange={surface.setSheetOpen}
      title="Add motion"
      description="Track a sample, visit, quote, or materials list."
      id="customer-motion"
      compactOnly
    >
      <AddMotionForm customerId={customerId} surface="plain" idPrefix="motion-sheet" />
    </AdminSheet>
  );
}

export default function SalesMotions({
  customerId,
  motions,
}: {
  customerId: string;
  motions: Motion[];
}) {
  const [statusState, statusAction, statusPending] = useActionState<SaveState, FormData>(
    setSalesMotionStatus,
    null
  );

  return (
    <section>
      <CustomerMotionAction customerId={customerId} />
      <p className="eyebrow">Sales motions</p>
      <div className="mt-4 grid gap-4">
        {motions.length === 0 ? (
          <div className="panel">
            <p className="font-serif text-[20px]">No sample motion yet.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-dusk">
              Track the next sample, visit, or quote here.
            </p>
          </div>
        ) : (
          motions.map((motion) => {
            const done = motion.status === "done";
            return (
              <article key={motion.id} className="panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-[20px] leading-snug">
                      {salesMotionLabel(motion.kind)}
                    </p>
                    <p className="mt-1 text-[14px] text-dusk">
                      {motion.scheduledFor
                        ? `For ${fmtDate(motion.scheduledFor)}`
                        : done && motion.completedAt
                          ? `Done ${fmtDate(motion.completedAt)}`
                          : "Open"}
                    </p>
                  </div>
                  <span className="chip-solid capitalize">{done ? "Done" : "Open"}</span>
                </div>
                {motion.note && (
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">{motion.note}</p>
                )}
                <form action={statusAction} className="mt-4 flex flex-wrap items-center gap-4">
                  <input type="hidden" name="id" value={motion.id} />
                  <input type="hidden" name="status" value={done ? "open" : "done"} />
                  <button
                    type="submit"
                    disabled={statusPending}
                    onClick={() => buzz(4)}
                    className="link-hair text-dusk text-[12px] disabled:opacity-60"
                  >
                    {statusPending ? "Saving..." : done ? "Reopen" : "Mark done"}
                  </button>
                </form>
              </article>
            );
          })
        )}
      </div>
      <div className="mt-3">
        <Sentence state={statusState} />
      </div>
    </section>
  );
}
