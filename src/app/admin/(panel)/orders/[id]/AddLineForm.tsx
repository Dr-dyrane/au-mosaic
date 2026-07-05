"use client";

import { useActionState, useEffect, useRef } from "react";
import { addLine, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";
import { buzz } from "@/lib/backoffice";

/* Every line carries two prices, list and given. The gap between them
   is the discount, finally a visible number. Given left empty means
   no discount: it takes the list price. A failure keeps what he
   typed; a success clears the desk for the next line. */

type Props = {
  orderId: string;
  pieces: { slug: string; name: string }[];
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function AddLineForm({ orderId, pieces }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(addLine, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} onSubmit={keepValues(action)} className="panel mt-8 grid gap-6" data-tour="add-line">
      <p className="font-serif text-[20px]">Add a line</p>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="pieceSlug" className={label}>
            Piece
          </label>
          <select
            id="pieceSlug"
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
          <label htmlFor="description" className={label}>
            Or describe it
          </label>
          <input
            id="description"
            name="description"
            aria-label="Line description"
            placeholder="Fixing, delivery, custom work"
            className={field}
          />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="quantity" className={label}>
            How many
          </label>
          <input
            id="quantity"
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
          <label htmlFor="listPrice" className={label}>
            List price
          </label>
          <input
            id="listPrice"
            name="listPrice"
            inputMode="numeric"
            placeholder="250,000"
            aria-label="List price in naira"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="givenPrice" className={label}>
            Given price
          </label>
          <input
            id="givenPrice"
            name="givenPrice"
            inputMode="numeric"
            placeholder="Same as list"
            aria-label="Given price in naira"
            className={field}
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} onClick={() => buzz(5)} className="btn-gold disabled:opacity-60">
          {pending ? "Adding..." : "Add the line"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
