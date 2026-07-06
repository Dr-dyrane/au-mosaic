import Link from "next/link";
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, notInArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import StatusStep from "./StatusStep";
import { DeliveryCreateAction } from "./new/NewDeliveryForm";
import Pager from "../Pager";
import Teach from "../Teach";
import { SelectableRow, SelectBar, SelectProvider, SelectToggle } from "../records/select";

/* The road, at a glance. Jobs waiting to go, jobs out with a driver,
   jobs landed. Each one moves forward a single step per tap, and the
   house keeps the day it landed. Active jobs show whole; the landed
   archive turns pages. Archived jobs step aside from the list and can
   be brought back or removed for good. */

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
  searchParams: Promise<{ page?: string; archived?: string }>;
}) {
  const { page: pageRaw, archived } = await searchParams;
  const pageAsked = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const showArchived = archived === "1";
  /* Archived rows step out of the working lists; live rows keep their
     place. One clause decides which side of the door we are on. */
  const liveGate = showArchived
    ? isNotNull(schema.deliveries.archivedAt)
    : isNull(schema.deliveries.archivedAt);

  const db = getDb();
  const active = await db
    .select({
      d: schema.deliveries,
      customerName: schema.customers.name,
    })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.deliveries.orderId, schema.orders.id))
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(and(inArray(schema.deliveries.status, ["pending", "out"]), liveGate))
    .orderBy(asc(schema.deliveries.scheduledFor));

  const [landedRow] = await db
    .select({ n: count() })
    .from(schema.deliveries)
    .where(and(eq(schema.deliveries.status, "delivered"), liveGate));
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
    .where(and(eq(schema.deliveries.status, "delivered"), liveGate))
    .orderBy(desc(schema.deliveries.deliveredAt))
    .limit(LANDED_PER_PAGE)
    .offset((page - 1) * LANDED_PER_PAGE);

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
  const deliveryOrders = openOrders.map((o) => ({
    id: o.id,
    label: `${o.customerName}, ${fmtDate(o.createdAt)}`,
  }));

  const groups = [
    {
      key: "pending",
      title: showArchived ? "Archived · waiting to go" : "Waiting to go",
      items: active.filter((r) => r.d.status === "pending"),
    },
    {
      key: "out",
      title: showArchived ? "Archived · on the road" : "On the road",
      items: active.filter((r) => r.d.status === "out"),
    },
    {
      key: "delivered",
      title: showArchived
        ? landedTotal > 0
          ? `Archived · landed · ${landedTotal}`
          : "Archived · landed"
        : landedTotal > 0
          ? `Landed · ${landedTotal}`
          : "Landed",
      items: landed,
    },
  ];

  return (
    <main>
      {deliveryOrders.length > 0 ? (
        <span
          hidden
          data-admin-action
          data-href="/admin/deliveries#delivery-create"
          data-label="New delivery"
          data-room="deliveries"
          data-intent={ADMIN_ACTION_INTENTS.deliveryCreate}
        />
      ) : (
        <span
          hidden
          data-admin-action
          data-href="/admin/orders"
          data-label="Orders"
          data-room="orders"
        />
      )}
      <DeliveryCreateAction orders={deliveryOrders} />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">The road</p>
          <h1 className="font-serif text-display-section mt-3">
            {showArchived ? "Archived deliveries." : "Deliveries."}
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
            {showArchived ? (
              "Set aside. Bring back or remove."
            ) : (
              <>
                Jobs on their way out.
                <Teach> Send it out, then mark it delivered.</Teach>
              </>
            )}
          </p>
        </div>
      </div>

      <SelectProvider entity="delivery" archived={showArchived}>
        <div className="mt-8 flex flex-wrap items-center gap-5 sm:gap-6">
          <SelectToggle />
          {showArchived ? (
            <Link href="/admin/deliveries" className="link-hair text-[12px] text-dusk">
              Back to open
            </Link>
          ) : (
            <Link href="/admin/deliveries?archived=1" className="link-hair text-[12px] text-dusk">
              Archived
            </Link>
          )}
        </div>

        {groups.map((g) => {
          if (g.items.length === 0) return null;
          return (
            <section key={g.key} className="mt-12">
              <p className="eyebrow">{g.title}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {g.items.map(({ d, customerName }) => (
                  <SelectableRow key={d.id} id={d.id} href={`/admin/orders/${d.orderId}`}>
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
                  </SelectableRow>
                ))}
              </div>
              {g.key === "delivered" && (
                <Pager
                  page={page}
                  pages={landedPages}
                  makeHref={(p) =>
                    showArchived
                      ? p === 1
                        ? "/admin/deliveries?archived=1"
                        : `/admin/deliveries?archived=1&page=${p}`
                      : p === 1
                        ? "/admin/deliveries"
                        : `/admin/deliveries?page=${p}`
                  }
                />
              )}
            </section>
          );
        })}

        {active.length === 0 && landedTotal === 0 && (
          showArchived ? (
            <div className="panel mt-10 max-w-md">
              <p className="font-serif text-[20px]">Nothing archived.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                Deliveries you set aside land here, ready to restore or remove.
              </p>
            </div>
          ) : (
            <div className="panel mt-10 max-w-md">
              <p className="font-serif text-[20px]">Nothing is on the road.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                A delivery hangs off an order: the address, the driver, the
                day it goes. Start one and this room walks it to the door.
              </p>
            </div>
          )
        )}

        <SelectBar />
      </SelectProvider>
    </main>
  );
}
