"use client";

import { useActionState, useEffect, useRef } from "react";
import AdminSheet from "@/components/AdminSheet";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { useAdminSurface } from "@/components/admin-surface-router";
import { addReturn, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";
import { buzz, naira } from "@/lib/backoffice";

export type ReturnLine = {
  id: string;
  name: string;
  unit: string;
  available: number;
  valueKobo: number;
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function AddReturnForm({
  orderId,
  lines,
  surface = "panel",
  idPrefix = "return",
}: {
  orderId: string;
  lines: ReturnLine[];
  surface?: "panel" | "plain";
  idPrefix?: string;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(addReturn, null);
  const ref = useRef<HTMLFormElement>(null);
  const plain = surface === "plain";

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      onSubmit={keepValues(action)}
      className={plain ? "grid gap-6" : "panel mt-8 grid gap-6"}
    >
      {!plain && <p className="font-serif text-[20px]">Record a return</p>}
      <input type="hidden" name="orderId" value={orderId} />
      {lines.length === 0 ? (
        <p className="text-[14px] leading-relaxed text-dusk">
          Nothing here can come back right now.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor={`${idPrefix}-item`} className={label}>
              What came back
            </label>
            <select
              id={`${idPrefix}-item`}
              name="itemId"
              aria-label="Returned item"
              defaultValue={lines[0]?.id}
              className={field}
            >
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name} · {line.available} {line.unit} left · {naira(line.valueKobo)} each
                </option>
              ))}
            </select>
          </div>
          <div className={`grid gap-6 ${plain ? "" : "sm:grid-cols-2"}`}>
            <div>
              <label htmlFor={`${idPrefix}-quantity`} className={label}>
                How many
              </label>
              <input
                id={`${idPrefix}-quantity`}
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                inputMode="numeric"
                aria-label="Returned quantity"
                className={field}
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-settlement`} className={label}>
                How it settles
              </label>
              <select
                id={`${idPrefix}-settlement`}
                name="settlement"
                defaultValue="credit"
                aria-label="Return settlement"
                className={field}
              >
                <option value="credit">Keep as credit</option>
                <option value="refund">Refund paid out</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-note`} className={label}>
              Note, if any
            </label>
            <input
              id={`${idPrefix}-note`}
              name="note"
              aria-label="Return note"
              placeholder="Broken carton, changed colour"
              className={field}
            />
          </div>
          <p className="text-[14px] leading-relaxed text-dusk">
            The original item stays.
          </p>
        </>
      )}
      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={pending || lines.length === 0}
          onClick={() => buzz(5)}
          className={`${plain ? "btn-gold" : "link-hair text-[12px]"} disabled:opacity-60`}
        >
          {pending ? "Recording..." : "Record the return"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}

export function OrderReturnAction({
  orderId,
  lines,
  showTrigger = false,
  className = "link-hair text-dusk text-[12px]",
}: {
  orderId: string;
  lines: ReturnLine[];
  showTrigger?: boolean;
  className?: string;
}) {
  const surface = useAdminSurface(
    { kind: "order-return", orderId, lines },
    { id: "order-return", intent: ADMIN_ACTION_INTENTS.orderReturn }
  );

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={surface.openSurface}
          aria-controls={surface.triggerProps["aria-controls"]}
          aria-expanded={surface.triggerProps["aria-expanded"]}
          className={className}
        >
          Record a return
        </button>
      )}
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="Record a return"
        description="The sale stays."
        id="order-return"
        compactOnly
      >
        <AddReturnForm
          orderId={orderId}
          lines={lines}
          surface="plain"
          idPrefix="order-return-sheet"
        />
      </AdminSheet>
    </>
  );
}
