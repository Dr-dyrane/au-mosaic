"use client";

import { useActionState } from "react";
import Link from "next/link";
import AdminSheet from "@/components/AdminSheet";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { useAdminSurface } from "@/components/admin-surface-router";
import { createDelivery, type SaveState } from "../actions";
import Sentence from "../../Sentence";
import { keepValues } from "../../keep";

/* One form, one Save. Labels speak shop floor: the order it belongs
   to, where it is going, who carries it, the day it goes. On success
   the action walks back to the deliveries room by itself. */

type Props = { orders: { id: string; label: string }[]; selectedOrder?: string };
type DeliveryFormProps = Props & {
  surface?: "panel" | "plain";
  idPrefix?: string;
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

function NoDeliveryOrders() {
  return (
    <div>
      <p className="font-serif text-[20px]">A delivery hangs off an order.</p>
      <p className="mt-2 text-[14px] leading-relaxed text-dusk">
        There is no open order to send out right now.
      </p>
      <Link href="/admin/orders" className="link-hair mt-4 text-[12px]">
        Go to the orders
      </Link>
    </div>
  );
}

export default function NewDeliveryForm({
  orders,
  selectedOrder,
  surface = "panel",
  idPrefix = "delivery",
}: DeliveryFormProps) {
  const [state, action, pending] = useActionState<SaveState, FormData>(createDelivery, null);
  const defaultOrder = orders.some((order) => order.id === selectedOrder) ? selectedOrder : "";
  const plain = surface === "plain";

  if (orders.length === 0) return <NoDeliveryOrders />;

  return (
    <form
      onSubmit={keepValues(action)}
      className={plain ? "grid gap-6" : "mt-10 grid max-w-3xl gap-8"}
    >
      <div className={plain ? "grid gap-6" : "panel grid gap-6"}>
        {!plain && <p className="font-serif text-[20px]">The job</p>}
        <div>
          <label htmlFor={`${idPrefix}-orderId`} className={label}>The order</label>
          <select
            id={`${idPrefix}-orderId`}
            name="orderId"
            required
            defaultValue={defaultOrder}
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
          <label htmlFor={`${idPrefix}-address`} className={label}>Address</label>
          <input
            id={`${idPrefix}-address`}
            name="address"
            required
            aria-label="Delivery address"
            placeholder="Where the tiles are going"
            className={field}
          />
        </div>
        <div className={`grid gap-6 ${plain ? "" : "sm:grid-cols-2"}`}>
          <div>
            <label htmlFor={`${idPrefix}-driver`} className={label}>Driver</label>
            <input
              id={`${idPrefix}-driver`}
              name="driver"
              aria-label="Driver"
              placeholder="Who carries it"
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-scheduledFor`} className={label}>Delivery day</label>
            <input
              id={`${idPrefix}-scheduledFor`}
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

export function DeliveryCreateAction({
  orders,
  selectedOrder,
  showTrigger = false,
  className = "link-hair text-dusk text-[12px]",
}: Props & {
  showTrigger?: boolean;
  className?: string;
}) {
  const surface = useAdminSurface(
    { kind: "delivery-create", orders, selectedOrder },
    { id: "delivery-create", intent: ADMIN_ACTION_INTENTS.deliveryCreate }
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
          New delivery
        </button>
      )}
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="New delivery"
        description="Put an order on the road."
        id="delivery-create"
        compactOnly
      >
        <NewDeliveryForm
          orders={orders}
          selectedOrder={selectedOrder}
          surface="plain"
          idPrefix="delivery-sheet"
        />
      </AdminSheet>
    </>
  );
}
