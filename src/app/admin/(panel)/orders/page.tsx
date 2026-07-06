import Link from "next/link";
import { and, count, desc, eq, ilike, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { OPEN_STEPS, STATUS_LABEL } from "./pipeline";
import OrderFilterSheet from "./OrderFilterSheet";
import { activeOrderFilterLabels } from "./order-filter-model";
import OrderCard, { type OrderRow } from "./OrderCard";
import { SelectBar, SelectProvider, SelectToggle } from "../records/select";

/* The order book, open at today. Orders group by where they stand on
   the line, and every card carries two truths: what was billed and
   what is still owed. Archived orders step aside from the list and can
   be brought back or removed for good. */

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string }>;
}) {
  const db = getDb();
  const { q, status, archived } = await searchParams;
  const query = (q ?? "").trim();
  const showArchived = archived === "1";
  const step = OPEN_STEPS.find((s) => s === status);
  const steps = step ? [step] : OPEN_STEPS;
  const activeFilters = { status: step, q: query || undefined };
  const activeLabels = activeOrderFilterLabels(activeFilters);

  const conds = [showArchived ? isNotNull(schema.orders.archivedAt) : isNull(schema.orders.archivedAt)];
  if (!showArchived) conds.push(ne(schema.orders.status, "settled"));
  if (query) conds.push(ilike(schema.customers.name, `%${query}%`));

  const open = await db
    .select({ order: schema.orders, customerName: schema.customers.name })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(and(...conds))
    .orderBy(desc(schema.orders.createdAt));

  const lineSums = await db
    .select({
      orderId: schema.orderItems.orderId,
      billed: sql<number>`sum(${schema.orderItems.givenPriceKobo} * ${schema.orderItems.quantity})`,
      gap: sql<number>`sum(case when ${schema.orderItems.givenPriceKobo} < ${schema.orderItems.listPriceKobo} then (${schema.orderItems.listPriceKobo} - ${schema.orderItems.givenPriceKobo}) * ${schema.orderItems.quantity} else 0 end)`,
    })
    .from(schema.orderItems)
    .groupBy(schema.orderItems.orderId);

  const paySums = await db
    .select({
      orderId: schema.payments.orderId,
      paid: sql<number>`sum(${schema.payments.amountKobo})`,
    })
    .from(schema.payments)
    .groupBy(schema.payments.orderId);

  const [settled] = await db
    .select({ n: count() })
    .from(schema.orders)
    .where(and(eq(schema.orders.status, "settled"), isNull(schema.orders.archivedAt)));

  const billedBy = new Map<string, number>(lineSums.map((r) => [r.orderId, Number(r.billed)]));
  const gapBy = new Map<string, number>(lineSums.map((r) => [r.orderId, Number(r.gap)]));
  const paidBy = new Map<string, number>(paySums.map((r) => [r.orderId, Number(r.paid)]));

  const rows: OrderRow[] = open.map(({ order, customerName }) => {
    const billed = billedBy.get(order.id) ?? 0;
    return {
      id: order.id,
      customerName,
      status: order.status,
      billed,
      balance: billed - (paidBy.get(order.id) ?? 0),
      gap: gapBy.get(order.id) ?? 0,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    };
  });

  return (
    <main>
      <span hidden data-admin-context-action data-href="/admin/export/orders.csv" data-label="Export orders" />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">Ledger</p>
          <h1 className="mt-3 font-serif text-display-section">{showArchived ? "Archived orders." : "The orders."}</h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
            {showArchived
              ? "Set aside, and easy to bring back or remove for good."
              : "List sits beside given. A discount is a number, not a feeling."}
          </p>
        </div>
      </div>

      <SelectProvider entity="order" archived={showArchived}>
        <div className="mt-8 flex flex-wrap items-center gap-5 sm:gap-6" data-tour="orders">
          {!showArchived && <OrderFilterSheet current={activeFilters} />}
          {activeLabels.length > 0 && (
            <p className="text-[14px] leading-relaxed text-dusk">
              Showing <span className="text-ink">{activeLabels.join(" / ")}</span>
              <Link href="/admin/orders" className="link-hair ml-4 text-[12px] text-dusk">
                Clear
              </Link>
            </p>
          )}
          <SelectToggle />
          {showArchived ? (
            <Link href="/admin/orders" className="link-hair text-[12px] text-dusk">
              Back to open
            </Link>
          ) : (
            <Link href="/admin/orders?archived=1" className="link-hair text-[12px] text-dusk">
              Archived
            </Link>
          )}
        </div>

        {showArchived ? (
          rows.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {rows.map((row) => (
                <OrderCard key={row.id} row={row} />
              ))}
            </div>
          ) : (
            <div className="panel mt-10 max-w-md">
              <p className="font-serif text-[20px]">Nothing archived.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                Orders you set aside land here, ready to restore or remove.
              </p>
            </div>
          )
        ) : (
          <>
            {steps.map((st) => {
              const group = rows.filter((r) => r.status === st);
              if (group.length === 0) return null;
              return (
                <section key={st} className="mt-12">
                  <p className="eyebrow">{STATUS_LABEL[st]}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {group.map((row) => (
                      <OrderCard key={row.id} row={row} />
                    ))}
                  </div>
                </section>
              );
            })}

            {step && rows.filter((r) => r.status === step).length === 0 && (
              <p className="mt-10 max-w-md text-[14px] leading-relaxed text-dusk">
                Nothing standing at {STATUS_LABEL[step]}. All open shows the whole line.
              </p>
            )}

            {rows.length === 0 && query && (
              <div className="panel mt-10 max-w-md">
                <p className="font-serif text-[20px]">Nothing for that name.</p>
                <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                  Check the spelling, or clear the search to see the whole book.
                </p>
                <Link href="/admin/orders" className="link-hair mt-5 inline-block text-[12px] text-dusk">
                  Clear the search
                </Link>
              </div>
            )}
            {rows.length === 0 && !query && (
              <div className="panel mt-10 max-w-md">
                <p className="font-serif text-[20px]">The book is open and empty.</p>
                <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                  An order starts as an enquiry, gets its lines, takes a deposit, and walks to settled. Start the first one and the book keeps itself.
                </p>
              </div>
            )}
          </>
        )}

        <SelectBar />
      </SelectProvider>

      {!showArchived && settled.n > 0 && (
        <div className="mt-14">
          <Link href="/admin/orders/settled" className="link-hair text-[12px] text-dusk">
            {settled.n === 1 ? "1 settled order" : `${settled.n} settled orders`}
          </Link>
        </div>
      )}
    </main>
  );
}
