import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira } from "@/lib/backoffice";
import { fmtDate } from "../pipeline";
import Pager from "../../Pager";
import Back from "../../Back";

const PER_PAGE = 24;

/* The archive shelf. Settled orders rest here with their history
   intact: what was billed, what was given below list, what came in.
   Nothing in this house is ever deleted. */

export const dynamic = "force-dynamic";

export default async function SettledOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const db = getDb();
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const [totalRow] = await db
    .select({ n: count() })
    .from(schema.orders)
    .where(eq(schema.orders.status, "settled"));
  const pages = Math.max(1, Math.ceil(totalRow.n / PER_PAGE));

  const rows = await db
    .select({ order: schema.orders, customerName: schema.customers.name })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(eq(schema.orders.status, "settled"))
    .orderBy(desc(schema.orders.updatedAt))
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

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

  const billedBy = new Map<string, number>(lineSums.map((r) => [r.orderId, Number(r.billed)]));
  const gapBy = new Map<string, number>(lineSums.map((r) => [r.orderId, Number(r.gap)]));
  const paidBy = new Map<string, number>(paySums.map((r) => [r.orderId, Number(r.paid)]));

  return (
    <main>
      <Back href="/admin/orders" label="Open orders" />
      <h1 className="font-serif text-display-section mt-6">Settled.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Paid in full and closed. Every order keeps its lines and payments;
        the book never forgets.
      </p>

      {rows.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {rows.map(({ order, customerName }) => {
            const billed = billedBy.get(order.id) ?? 0;
            const balance = billed - (paidBy.get(order.id) ?? 0);
            const gap = gapBy.get(order.id) ?? 0;
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
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
                {gap > 0 && (
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                    Discount given · {naira(gap)} below list
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <Pager page={page} pages={pages} makeHref={(p) => `/admin/orders/settled?page=${p}`} />

      {rows.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nothing settled yet.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            When the last naira arrives, move the order to settled and it
            rests here with its history.
          </p>
        </div>
      )}
    </main>
  );
}
