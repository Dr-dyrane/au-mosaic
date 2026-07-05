"use client";

import { useActionState, useEffect, useRef } from "react";
import { addReturn, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";
import { buzz, naira } from "@/lib/backoffice";

type ReturnLine = {
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
}: {
  orderId: string;
  lines: ReturnLine[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(addReturn, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} onSubmit={keepValues(action)} className="panel mt-8 grid gap-6">
      <p className="font-serif text-[20px]">Record a return</p>
      <input type="hidden" name="orderId" value={orderId} />
      {lines.length === 0 ? (
        <p className="text-[14px] leading-relaxed text-dusk">
          Nothing here can come back right now.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="returnItemId" className={label}>
              What came back
            </label>
            <select
              id="returnItemId"
              name="itemId"
              aria-label="Returned line"
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
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="returnQuantity" className={label}>
                How many
              </label>
              <input
                id="returnQuantity"
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
              <label htmlFor="settlement" className={label}>
                How it settles
              </label>
              <select
                id="settlement"
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
            <label htmlFor="returnNote" className={label}>
              Note, if any
            </label>
            <input
              id="returnNote"
              name="note"
              aria-label="Return note"
              placeholder="Broken carton, changed colour"
              className={field}
            />
          </div>
          <p className="text-[13px] leading-relaxed text-dusk">
            The original line stays. The return writes beside it.
          </p>
        </>
      )}
      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={pending || lines.length === 0}
          onClick={() => buzz(5)}
          className="link-hair text-[13px] disabled:opacity-60"
        >
          {pending ? "Recording..." : "Record the return"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
