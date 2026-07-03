import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import StatusStep from "./StatusStep";

/* The road, at a glance. Jobs waiting to go, jobs out with a driver,
   jobs landed. Each one moves forward a single step per tap, and the
   house keeps the day it landed. */

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DeliveriesPage() {
  const db = getDb();
  const rows = await db
    .select({
      d: schema.deliveries,
      customerName: schema.customers.name,
    })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.deliveries.orderId, schema.orders.id))
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .orderBy(asc(schema.deliveries.scheduledFor));

  const pending = rows.filter((r) => r.d.status === "pending");
  const out = rows.filter((r) => r.d.status === "out");
  const delivered = rows
    .filter((r) => r.d.status === "delivered")
    .sort(
      (a, b) =>
        (b.d.deliveredAt ? new Date(b.d.deliveredAt).getTime() : 0) -
        (a.d.deliveredAt ? new Date(a.d.deliveredAt).getTime() : 0)
    )
    .slice(0, 10);

  const groups = [
    { key: "pending", title: "Waiting to go", items: pending },
    { key: "out", title: "On the road", items: out },
    { key: "delivered", title: "Landed", items: delivered },
  ];

  return (
    <main>
      <p className="eyebrow">The road</p>
      <h1 className="font-serif text-display-section mt-3">Deliveries.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Every job on its way to a wall. Send it out, mark it delivered,
        and the house remembers the day it landed.
      </p>
      <div className="mt-6">
        <Link href="/admin/deliveries/new" className="btn-gold">
          New delivery
        </Link>
      </div>

      {groups.map((g) => {
        if (g.items.length === 0) return null;
        return (
          <section key={g.key} className="mt-12">
            <p className="eyebrow">{g.title}</p>
            <div className="mt-4 grid max-w-2xl gap-4">
              {g.items.map(({ d, customerName }) => (
                <article key={d.id} className="panel">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="font-serif text-[18px]">{customerName}</p>
                    <Link
                      href={`/admin/orders/${d.orderId}`}
                      className="link-hair text-[13px] text-dusk"
                    >
                      See the order
                    </Link>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-dusk">{d.address}</p>
                  {(d.driver || (d.status !== "delivered" && d.scheduledFor)) && (
                    <p className="mt-1 text-[13px] text-dusk">
                      {[
                        d.driver ? `With ${d.driver}` : null,
                        d.status !== "delivered" && d.scheduledFor
                          ? `Due ${fmtDate(d.scheduledFor)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <div className="mt-4">
                    {d.status === "pending" && (
                      <StatusStep id={d.id} to="out" label="Send it out" />
                    )}
                    {d.status === "out" && (
                      <StatusStep id={d.id} to="delivered" label="Mark it delivered" />
                    )}
                    {d.status === "delivered" && d.deliveredAt && (
                      <p className="text-[13px] text-dusk">Landed {fmtDate(d.deliveredAt)}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {rows.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nothing is on the road.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            A delivery hangs off an order: the address, the driver, the
            day it goes. Start one and this room walks it to the door.
          </p>
        </div>
      )}
    </main>
  );
}
