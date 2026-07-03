"use client";

import { useActionState } from "react";
import { createDelivery, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";

/* One form, one Save. Labels speak shop floor: the order it belongs
   to, where it is going, who carries it, the day it goes. On success
   the action walks back to the deliveries room by itself. */

type Props = { orders: { id: string; label: string }[] };

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

export default function NewDeliveryForm({ orders }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(createDelivery, null);

  return (
    <form onSubmit={keepValues(action)} className="mt-10 grid max-w-3xl gap-8">
      <div className="panel grid gap-6">
        <p className="font-serif text-[20px]">The job</p>
        <div>
          <label htmlFor="orderId" className={label}>The order</label>
          <select
            id="orderId"
            name="orderId"
            required
            defaultValue=""
            aria-label="The order this delivery belongs to"
            className={field}
          >
            <option value="" disabled>
              Pick an order
            </option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="address" className={label}>Address</label>
          <input
            id="address"
            name="address"
            required
            aria-label="Delivery address"
            placeholder="Where the tiles are going"
            className={field}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="driver" className={label}>Driver</label>
            <input
              id="driver"
              name="driver"
              aria-label="Driver"
              placeholder="Who carries it"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="scheduledFor" className={label}>Delivery day</label>
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="date"
              aria-label="Delivery day"
              className={field}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
          {pending ? "Saving..." : "Save the delivery"}
        </button>
        <Sentence state={state} />
      </div>
    </form>
  );
}
