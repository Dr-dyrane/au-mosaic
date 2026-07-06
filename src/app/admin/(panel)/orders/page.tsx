import Link from "next/link";
import { and, count, desc, eq, ilike, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira } from "@/lib/backoffice";
import { OPEN_STEPS, STATUS_LABEL, fmtDate } from "./pipeline";
import OrderFilterSheet from "./OrderFilterSheet";
import { activeOrderFilterLabels } from "./order-filter-model";

/* The order book, open at today. Orders group by where they stand on
   the line, and every card carries two truths: what was billed and
   what is still owed. Where a price was given below list, the gap is
   printed. Discounts stop hiding here. */

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const db = getDb();
  const { q, status } = await searchParams;
  const query = (q ?? "").trim();
  const step = OPEN_STEPS.find((s) => s === status);
  const steps = step ? [step] : OPEN_STEPS;
  const activeFilters = {
    status: step,
    q: query || undefined,
  };
  const activeLabels = activeOrderFilterLabels(activeFilters);

  const open = await db
    .select({ order: schema.orders, customerName: schema.customers.name })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(
      query
        ? and(ne(schema.orders.status, "settled"), ilike(schema.customers.name, `%${query}%`))
        : ne(schema.orders.status, "settled")
    )
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
    .where(eq(schema.orders.status, "settled"));

  const billedBy = new Map<string, number>(lineSums.map((r) => [r.orderId, Number(r.billed)]));
  const gapBy = new Map<string, number>(lineSums.map((r) => [r.orderId, Number(r.gap)]));
  const paidBy = new Map<string, number>(paySums.map((r) => [r.orderId, Number(r.paid)]));

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">Ledger</p>
          <h1 className="font-serif text-display-section mt-3">The orders.</h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
            List sits beside given. A discount is a number, not a feeling.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5 sm:gap-6" data-tour="orders">
        <OrderFilterSheet current={activeFilters} />
        {activeLabels.length > 0 && (
          <p className="text-[14px] leading-relaxed text-dusk">
            Showing <span className="text-ink">{activeLabels.join(" / ")}</span>
            <Link href="/admin/orders" className="link-hair ml-4 text-dusk text-[12px]">
              Clear
            </Link>
          </p>
        )}
        {/* A plain link, so the book prints itself with no script. */}
        <a href="/admin/export/orders.csv" className="link-hair hidden text-dusk text-[12px] sm:inline-flex">
          CSV for the accountant
        </a>
        <button data-tour-start="orders" className="link-hair hidden text-dusk text-[12px] sm:inline-flex">
          Learn this room
        </button>
      </div>

      {steps.map((st) => {
        const group = open.filter((r) => r.order.status === st);
        if (group.length === 0) return null;
        return (
          <section key={st} className="mt-12">
            <p className="eyebrow">{STATUS_LABEL[st]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {group.map(({ order, customerName }) => {
                const billed = billedBy.get(order.id) ?? 0;
                const balance = billed - (paidBy.get(order.id) ?? 0);
                const gap = gapBy.get(order.id) ?? 0;
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    data-tour="order-card"
                    className="panel group block transition-transform duration-300 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-serif text-[20px] leading-snug transition-colors duration-300 group-hover:text-gold">
                        {customerName}
                      </p>
                      <p className="shrink-0 text-[12px] uppercase tracking-[0.14em] text-mist">
                        {fmtDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <p className="text-[14px] text-dusk">Billed {naira(billed)}</p>
                      <p className="text-[14px] font-medium text-ink">Balance {naira(balance)}</p>
                    </div>
                    {st === "enquiry" && billed === 0 && (
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
                        No lines yet
                      </p>
                    )}
                    {gap > 0 && (
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                        Discount given / {naira(gap)} below list
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {step && open.filter((r) => r.order.status === step).length === 0 && (
        <p className="mt-10 max-w-md text-[14px] leading-relaxed text-dusk">
          Nothing standing at {STATUS_LABEL[step]}. All open shows the whole line.
        </p>
      )}

      {open.length === 0 && query && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nothing for that name.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Check the spelling, or clear the search to see the whole book.
          </p>
          <Link href="/admin/orders" className="link-hair mt-5 inline-block text-dusk text-[12px]">
            Clear the search
          </Link>
        </div>
      )}
      {open.length === 0 && !query && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The book is open and empty.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            An order starts as an enquiry, gets its lines, takes a deposit,
            and walks to settled. Start the first one and the book keeps
            itself.
          </p>
        </div>
      )}

      {settled.n > 0 && (
        <div className="mt-14">
          <Link href="/admin/orders/settled" className="link-hair text-dusk text-[12px]">
            {settled.n === 1 ? "1 settled order" : `${settled.n} settled orders`}
          </Link>
        </div>
      )}
    </main>
  );
}
