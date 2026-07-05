"use client";

import { useActionState, useEffect, useRef } from "react";
import { buzz } from "@/lib/backoffice";
import { SALES_MOTIONS, salesMotionLabel } from "@/lib/sales-motions";
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

function fmtDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SalesMotions({
  customerId,
  motions,
}: {
  customerId: string;
  motions: Motion[];
}) {
  const [addState, addAction, addPending] = useActionState<SaveState, FormData>(addSalesMotion, null);
  const [statusState, statusAction, statusPending] = useActionState<SaveState, FormData>(
    setSalesMotionStatus,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState?.ok) formRef.current?.reset();
  }, [addState]);

  return (
    <section>
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
                    <p className="mt-1 text-[13px] text-dusk">
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
                    className="link-hair text-dusk text-[13px] disabled:opacity-60"
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

      <form ref={formRef} onSubmit={keepValues(addAction)} className="panel mt-4 grid gap-5">
        <input type="hidden" name="customerId" value={customerId} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="motion-kind" className={label}>Motion</label>
            <select id="motion-kind" name="kind" className={field} defaultValue="sample_pictures">
              {SALES_MOTIONS.map((motion) => (
                <option key={motion.key} value={motion.key}>
                  {motion.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="motion-date" className={label}>Date</label>
            <input id="motion-date" name="scheduledFor" type="date" className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="motion-note" className={label}>Note</label>
          <textarea
            id="motion-note"
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
            className="link-hair text-dusk text-[13px] disabled:opacity-60"
          >
            {addPending ? "Adding..." : "Add motion"}
          </button>
          <Sentence state={addState} />
        </div>
      </form>
    </section>
  );
}
