import Link from "next/link";
import { desc, eq, notInArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import NewDeliveryForm from "./NewDeliveryForm";

/* A delivery starts from an order, never from thin air. This page
   fetches the open orders and hands the form a short list labelled
   in shop words: who it is for, and when the job was opened. */

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderRaw } = await searchParams;
  const selectedOrder = orderRaw && UUID.test(orderRaw) ? orderRaw : undefined;
  const db = getDb();
  const openOrders = await db
    .select({
      id: schema.orders.id,
      createdAt: schema.orders.createdAt,
      customerName: schema.customers.name,
    })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(notInArray(schema.orders.status, ["enquiry", "settled"]))
    .orderBy(desc(schema.orders.createdAt));

  return (
    <main>
      <Link href="/admin/deliveries" className="link-hair text-dusk text-[12px]">
        All deliveries
      </Link>
      <h1 className="font-serif text-display-section mt-6">A new delivery.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Pick the order, write the address, name the driver. The road
        does the rest.
      </p>

      {openOrders.length === 0 ? (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">A delivery hangs off an order.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            There is no open order to send out right now. Open one
            first, then come back here.
          </p>
          <Link href="/admin/orders" className="link-hair mt-4 text-[12px]">
            Go to the orders
          </Link>
        </div>
      ) : (
        <NewDeliveryForm
          orders={openOrders.map((o) => ({
            id: o.id,
            label: `${o.customerName}, ${fmtDate(o.createdAt)}`,
          }))}
          selectedOrder={selectedOrder}
        />
      )}
    </main>
  );
}
