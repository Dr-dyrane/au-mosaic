"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import AdminSheet from "@/components/AdminSheet";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { useAdminSurface } from "@/components/admin-surface-router";
import { addLine, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";
import { buzz } from "@/lib/backoffice";

/* Every line carries two prices, list and given. The gap between them
   is the discount, finally a visible number. Given left empty means
   no discount: it takes the list price. A failure keeps what he
   typed; a success clears the desk for the next line, puts the hand
   back on the first field, and counts the tally, so a three-line
   order is one opening, three saves, one close. */

type Props = {
  orderId: string;
  pieces: { slug: string; name: string }[];
  surface?: "panel" | "plain";
  idPrefix?: string;
  onDone?: () => void;
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function AddLineForm({
  orderId,
  pieces,
  surface = "panel",
  idPrefix = "line",
  onDone,
}: Props) {
  const [saved, setSaved] = useState(0);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    async (prev, form) => {
      const answer = await addLine(prev, form);
      if (answer?.ok) setSaved((n) => n + 1);
      return answer;
    },
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  const plain = surface === "plain";

  useEffect(() => {
    if (!state?.ok) return;
    ref.current?.reset();
    const first = ref.current?.elements.namedItem("pieceSlug");
    if (first instanceof HTMLElement) first.focus({ preventScroll: true });
  }, [state]);

  return (
    <form
      id={idPrefix}
      ref={ref}
      onSubmit={keepValues(action)}
      className={plain ? "grid gap-6" : "panel mt-8 grid gap-6"}
      data-tour="add-line"
    >
      {!plain && <p className="font-serif text-[20px]">Add an item</p>}
      <input type="hidden" name="orderId" value={orderId} />
      <div className={`grid gap-6 ${plain ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor={`${idPrefix}-pieceSlug`} className={label}>
            Piece
          </label>
          <select
            id={`${idPrefix}-pieceSlug`}
            name="pieceSlug"
            aria-label="Piece"
            defaultValue=""
            className={field}
          >
            <option value="">No piece, describe it below</option>
            {pieces.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-description`} className={label}>
            Or describe it
          </label>
          <input
            id={`${idPrefix}-description`}
            name="description"
            aria-label="Item description"
            placeholder="Fixing, delivery, custom work"
            className={field}
          />
        </div>
      </div>
      <div className={`grid gap-6 ${plain ? "" : "sm:grid-cols-3"}`}>
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
            aria-label="Quantity"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-listPrice`} className={label}>
            Usual price
          </label>
          <input
            id={`${idPrefix}-listPrice`}
            name="listPrice"
            inputMode="numeric"
            placeholder="250,000"
            aria-label="Usual price in naira"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-givenPrice`} className={label}>
            Price you gave
          </label>
          <input
            id={`${idPrefix}-givenPrice`}
            name="givenPrice"
            inputMode="numeric"
            placeholder="Same as usual"
            aria-label="Price you gave in naira"
            className={field}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          onClick={() => buzz(5)}
          className={`${plain ? "btn-gold" : "link-hair text-[12px]"} disabled:opacity-60`}
        >
          {pending ? "Adding..." : "Add the item"}
        </button>
        {onDone && saved > 0 && (
          <button type="button" onClick={onDone} className="link-hair text-dusk text-[12px]">
            Done
          </button>
        )}
        <Sentence state={state} />
      </div>
      {saved > 0 && (
        <p className="-mt-3 text-[12px] text-mist">
          {saved === 1 ? "1 item added." : `${saved} items added.`}
        </p>
      )}
    </form>
  );
}

export function OrderLineAction({
  orderId,
  pieces,
  showTrigger = false,
  className = "link-hair text-dusk text-[12px]",
}: {
  orderId: string;
  pieces: { slug: string; name: string }[];
  showTrigger?: boolean;
  className?: string;
}) {
  const surface = useAdminSurface(
    { kind: "order-line", orderId, pieces },
    { id: "order-line", intent: ADMIN_ACTION_INTENTS.orderLine }
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
          Add an item
        </button>
      )}
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="Add an item"
        description="Name it, and the price."
        id="order-line"
        compactOnly
      >
        <AddLineForm
          orderId={orderId}
          pieces={pieces}
          surface="plain"
          idPrefix="order-line-sheet"
          onDone={surface.closeSheet}
        />
      </AdminSheet>
    </>
  );
}
