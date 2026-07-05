import Link from "next/link";
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import StatusStep from "./StatusStep";
import Pager from "../Pager";
import Teach from "../Teach";

/* The road, at a glance. Jobs waiting to go, jobs out with a driver,
   jobs landed. Each one moves forward a single step per tap, and the
   house keeps the day it landed. Active jobs show whole; the landed
   archive turns pages. */

export const dynamic = "force-dynamic";

const LANDED_PER_PAGE = 10;

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const pageAsked = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const db = getDb();
  const active = await db
    .select({
      d: schema.deliveries,
      customerName: schema.customers.name,
    })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.deliveries.orderId, schema.orders.id))
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(inArray(schema.deliveries.status, ["pending", "out"]))
    .orderBy(asc(schema.deliveries.scheduledFor));

  const [landedRow] = await db
    .select({ n: count() })
    .from(schema.deliveries)
    .where(eq(schema.deliveries.status, "delivered"));
  const landedTotal = landedRow.n;
  const landedPages = Math.max(1, Math.ceil(landedTotal / LANDED_PER_PAGE));
  /* A page past the end walks back to the last one, never a dead end. */
  const page = Math.min(pageAsked, landedPages);

  const landed = await db
    .select({
      d: schema.deliveries,
      customerName: schema.customers.name,
    })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.deliveries.orderId, schema.orders.id))
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(eq(schema.deliveries.status, "delivered"))
    .orderBy(desc(schema.deliveries.deliveredAt))
    .limit(LANDED_PER_PAGE)
    .offset((page - 1) * LANDED_PER_PAGE);

  const groups = [
    { key: "pending", title: "Waiting to go", items: active.filter((r) => r.d.status === "pending") },
    { key: "out", title: "On the road", items: active.filter((r) => r.d.status === "out") },
    {
      key: "delivered",
      title: landedTotal > 0 ? `Landed · ${landedTotal}` : "Landed",
      items: landed,
    },
  ];

  return (
    <main>
      {/* Title left, the one gold right; the phone wraps it back
          under the thumb. */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">The road</p>
          <h1 className="font-serif text-display-section mt-3">Deliveries.</h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
            Every job on its way to a wall.
            <Teach>
              {" "}Send it out, mark it delivered, and the house remembers
              the day it landed.
            </Teach>
          </p>
        </div>
        <Link href="/admin/deliveries/new" className="btn-gold admin-page-action">
          New delivery
        </Link>
      </div>

      {groups.map((g) => {
        if (g.items.length === 0) return null;
        return (
          <section key={g.key} className="mt-12">
            <p className="eyebrow">{g.title}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {g.items.map(({ d, customerName }) => (
                <article key={d.id} className="panel">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="font-serif text-[20px]">{customerName}</p>
                    <Link
                      href={`/admin/orders/${d.orderId}`}
                      className="link-hair text-[12px] text-dusk"
                    >
                      See the order
                    </Link>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-dusk">{d.address}</p>
                  {(d.driver || (d.status !== "delivered" && d.scheduledFor)) && (
                    <p className="mt-1 text-[14px] text-dusk">
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
                      <p className="text-[14px] text-dusk">Landed {fmtDate(d.deliveredAt)}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {g.key === "delivered" && (
              <Pager
                page={page}
                pages={landedPages}
                makeHref={(p) => (p === 1 ? "/admin/deliveries" : `/admin/deliveries?page=${p}`)}
              />
            )}
          </section>
        );
      })}

      {active.length === 0 && landedTotal === 0 && (
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
