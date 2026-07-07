import Link from "next/link";
import { and, asc, eq, isNull, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira, waChat } from "@/lib/backoffice";
import Teach from "../Teach";

/* Who owes what. The room Nonso asked for first: every order billed
   more than it is paid, grouped by customer, the longest forgotten
   debt at the top. Read only; the only way out is a gentle WhatsApp
   nudge from the customer panel. */

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  quoted: "Quoted",
  deposit: "Deposit paid",
  delivered: "Delivered",
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type OwingOrder = { id: string; status: string; createdAt: Date; balance: number };
type Debtor = { id: string; name: string; phone: string; total: number; orders: OwingOrder[] };

export default async function DebtsPage() {
  const db = getDb();

  /* Live orders with their customer, oldest first, so each debtor
     lists debts in the order they were forgotten. */
  const liveOrders = await db
    .select({
      id: schema.orders.id,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
      customerId: schema.customers.id,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
    })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(and(notInArray(schema.orders.status, ["enquiry", "settled"]), isNull(schema.orders.archivedAt)))
    .orderBy(asc(schema.orders.createdAt));

  /* Two grouped sums, stitched in JS. Simple beats clever. */
  const billedRows = await db
    .select({
      orderId: schema.orderItems.orderId,
      billed: sql<number>`sum(${schema.orderItems.givenPriceKobo} * ${schema.orderItems.quantity})`,
    })
    .from(schema.orderItems)
    .groupBy(schema.orderItems.orderId);

  const paidRows = await db
    .select({
      orderId: schema.payments.orderId,
      paid: sql<number>`sum(${schema.payments.amountKobo})`,
    })
    .from(schema.payments)
    .groupBy(schema.payments.orderId);

  const billed = new Map<string, number>(billedRows.map((r) => [r.orderId, Number(r.billed)]));
  const paid = new Map<string, number>(paidRows.map((r) => [r.orderId, Number(r.paid)]));

  const byCustomer = new Map<string, Debtor>();
  for (const o of liveOrders) {
    const balance = (billed.get(o.id) ?? 0) - (paid.get(o.id) ?? 0);
    if (balance <= 0) continue;
    let debtor = byCustomer.get(o.customerId);
    if (!debtor) {
      debtor = {
        id: o.customerId,
        name: o.customerName,
        phone: o.customerPhone,
        total: 0,
        orders: [],
      };
      byCustomer.set(o.customerId, debtor);
    }
    debtor.total += balance;
    debtor.orders.push({ id: o.id, status: o.status, createdAt: o.createdAt, balance });
  }

  /* Orders arrived oldest first, so each debtor's first line is their
     oldest debt. The longest forgotten customer goes to the top. */
  const debtors = [...byCustomer.values()].sort(
    (a, b) =>
      new Date(a.orders[0].createdAt).getTime() - new Date(b.orders[0].createdAt).getTime()
  );
  const grand = debtors.reduce((total, d) => total + d.total, 0);
  const oldestWithPhone = debtors.find((d) => d.phone);
  const oldestReminder = oldestWithPhone
    ? waChat(
        oldestWithPhone.phone,
        `Good day ${oldestWithPhone.name}. A gentle reminder from AU Mosaic on a balance of ${naira(oldestWithPhone.total)}. Thank you.`
      )
    : null;

  return (
    <main>
      {oldestReminder && (
        <span
          hidden
          data-admin-action
          data-href={oldestReminder}
          data-label="Remind oldest"
          data-room="owed"
          data-external="true"
        />
      )}
      {!oldestReminder && debtors.length > 0 && (
        <span
          hidden
          data-admin-action
          data-href="/admin/orders"
          data-label="Open orders"
          data-room="orders"
        />
      )}
      {debtors.length > 0 && (
        <span
          hidden
          data-admin-context-action
          data-href="/admin/export/debts.csv"
          data-label="Export debts"
        />
      )}
      <p className="eyebrow">The ledger</p>
      <h1 className="font-serif text-display-section mt-3" data-tour="debts">Who owes what.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Unpaid balances, oldest first.
        <Teach> Tap a name to nudge on WhatsApp.</Teach>
      </p>

      {debtors.length > 0 && (
        <div className="mt-8">
          <p className="font-serif text-display-section leading-none">{naira(grand)}</p>
          <p className="mt-2 text-[14px] text-dusk">owed across everyone</p>
        </div>
      )}

      <div className="mt-10 grid items-start gap-4 lg:grid-cols-2">
        {debtors.map((d, i) => (
          <section key={d.id} className="panel">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-serif text-[20px]">{d.name}</p>
              <p className="font-serif text-[20px]">{naira(d.total)}</p>
            </div>
            {d.phone && (
              <a
                href={waChat(
                  d.phone,
                  `Good day ${d.name}. A gentle reminder from AU Mosaic on a balance of ${naira(d.total)}. Thank you.`
                )}
                target="_blank"
                rel="noopener"
                className="link-hair mt-2 text-[12px] text-dusk"
              >
                {i === 0 ? "Oldest reminder" : "WhatsApp them"}
              </a>
            )}
            <div className="mt-5 grid gap-3">
              {d.orders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-3">
                  <p className="text-[14px] text-dusk">{fmtDate(o.createdAt)}</p>
                  <span className="chip-solid shrink-0">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <p className="ml-auto text-[14px]">{naira(o.balance)}</p>
                  <Link href={`/admin/orders/${o.id}`} className="link-hair text-[12px]">
                    See the order
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {debtors.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nobody owes the house. Enjoy it.</p>
        </div>
      )}
    </main>
  );
}
