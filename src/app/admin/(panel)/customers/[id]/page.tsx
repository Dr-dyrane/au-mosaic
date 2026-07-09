import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira, waChat } from "@/lib/backoffice";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import CustomerForm from "./CustomerForm";
import SalesMotions from "./SalesMotions";
import Back from "../../Back";
import { Touch } from "../../touched";

/* The customer record: who they are, what they ordered, what is still
   owed, and their chat one tap away. Billed and paid are summed fresh
   from order lines and payments on every open. Balances are never
   stored, so they are never stale. */

export const dynamic = "force-dynamic";

/* A bad id must read as not found, not as a database error. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = getDb();
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id));
  if (!customer) notFound();

  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerId, id))
    .orderBy(desc(schema.orders.createdAt));

  const billedRows = await db
    .select({
      orderId: schema.orderItems.orderId,
      billed: sql`coalesce(sum(${schema.orderItems.givenPriceKobo} * ${schema.orderItems.quantity}), 0)`.mapWith(Number),
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .where(eq(schema.orders.customerId, id))
    .groupBy(schema.orderItems.orderId);

  const paidRows = await db
    .select({
      orderId: schema.payments.orderId,
      paid: sql`coalesce(sum(${schema.payments.amountKobo}), 0)`.mapWith(Number),
    })
    .from(schema.payments)
    .innerJoin(schema.orders, eq(schema.payments.orderId, schema.orders.id))
    .where(eq(schema.orders.customerId, id))
    .groupBy(schema.payments.orderId);

  const enquiries = await db
    .select()
    .from(schema.enquiries)
    .where(eq(schema.enquiries.customerId, id))
    .orderBy(desc(schema.enquiries.createdAt));

  const motions = await db
    .select()
    .from(schema.salesMotions)
    .where(eq(schema.salesMotions.customerId, id))
    .orderBy(
      sql`case when ${schema.salesMotions.status} = 'open' then 0 else 1 end`,
      desc(schema.salesMotions.createdAt)
    );

  const billedBy = new Map(billedRows.map((r) => [r.orderId, r.billed]));
  const paidBy = new Map(paidRows.map((r) => [r.orderId, r.paid]));
  /* A debt counts only on a live order: not an enquiry, not settled,
     not archived. The same rule the Debts room and the glance keep, so
     the record and the ledger never disagree. */
  const isDebtOrder = (o: (typeof orders)[number]) =>
    o.status !== "enquiry" && o.status !== "settled" && !o.archivedAt;
  const totalOwed = orders.reduce((sum, order) => {
    if (!isDebtOrder(order)) return sum;
    const balance = (billedBy.get(order.id) ?? 0) - (paidBy.get(order.id) ?? 0);
    return sum + Math.max(balance, 0);
  }, 0);
  const latestOrder = orders[0];
  const deliveryOrder = orders.find((order) => (
    order.status !== "delivered" && order.status !== "settled"
  ));
  const shellActions = [
    customer.phone
      ? { href: waChat(customer.phone), label: "WhatsApp", external: true }
      : null,
    totalOwed > 0 ? { href: "/admin/debts", label: "Owed" } : null,
    deliveryOrder
      ? { href: `/admin/deliveries/new?order=${deliveryOrder.id}`, label: "Delivery" }
      : null,
    latestOrder ? { href: `/admin/invoice/${latestOrder.id}`, label: "The invoice" } : null,
  ].filter((action): action is { href: string; label: string; external?: boolean } => Boolean(action));

  return (
    <main>
      {shellActions.map((action) => (
        <span
          key={`${action.href}-${action.label}`}
          hidden
          data-admin-context-action
          data-href={action.href}
          data-label={action.label}
          data-external={action.external ? "true" : undefined}
        />
      ))}
      <span
        hidden
        data-admin-context-action
        data-href={`/admin/customers/${id}#customer-motion`}
        data-label="Add motion"
        data-intent={ADMIN_ACTION_INTENTS.customerMotion}
      />
      {/* The record's vitals for the context rail: the same sums this
          page just computed, so the rail and the page cannot disagree. */}
      <span hidden data-admin-context-fact data-label="Orders" data-value={String(orders.length)} />
      {totalOwed > 0 && (
        <span hidden data-admin-context-fact data-label="Owed" data-value={naira(totalOwed)} />
      )}
      {motions.some((motion) => motion.status === "open") && (
        <span
          hidden
          data-admin-context-fact
          data-label="Open motions"
          data-value={String(motions.filter((motion) => motion.status === "open").length)}
        />
      )}
      <Back href="/admin/customers" label="All customers" />
      <h1 className="font-serif text-display-section mt-6">{customer.name}</h1>
      <Touch href={`/admin/customers/${id}`} label={customer.name} room="Customers" />
      {customer.area && (
        <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-mist">
          {customer.area}
        </p>
      )}

      {/* The desk pairs the person with their history: details on
          the left, orders and enquiries on the right. The phone
          keeps its single file. */}
      <div className="mt-12 grid max-w-3xl items-start gap-x-10 gap-y-12 xl:max-w-none xl:grid-cols-2">
      <section className="xl:order-2">
        <p className="eyebrow">Their orders</p>
        {orders.length === 0 ? (
          <p className="mt-4 text-[14px] leading-relaxed text-dusk">
            No orders yet. The first one starts in the orders room.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {orders.map((o) => {
              const billed = billedBy.get(o.id) ?? 0;
              const paid = paidBy.get(o.id) ?? 0;
              const balance = billed - paid;
              return (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="panel group block transition-transform duration-300 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="chip-solid capitalize">{o.status}</span>
                    <p className="text-[14px] text-dusk">{fmtDate(o.createdAt)}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-[14px]">{naira(billed)} billed</p>
                    {isDebtOrder(o) && balance > 0 ? (
                      <p className="text-[14px] font-semibold text-gold">
                        {naira(balance)} owing
                      </p>
                    ) : billed > 0 && balance <= 0 ? (
                      <p className="text-[14px] text-dusk">Paid in full</p>
                    ) : billed > 0 ? (
                      <p className="text-[14px] text-dusk">{naira(billed)} quoted</p>
                    ) : (
                      <p className="text-[14px] text-dusk">No lines yet</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="xl:order-3">
        <SalesMotions
          customerId={customer.id}
          motions={motions.map((motion) => ({
            id: motion.id,
            kind: motion.kind,
            status: motion.status,
            note: motion.note,
            scheduledFor: motion.scheduledFor,
            completedAt: motion.completedAt,
          }))}
        />
      </section>

      {enquiries.length > 0 && (
        <section className="xl:order-4">
          <p className="eyebrow">Their enquiries</p>
          <div className="mt-4 grid gap-4">
            {enquiries.map((e) => (
              <div key={e.id} className="panel">
                <div className="flex items-center justify-between gap-4">
                  <span className="chip-solid capitalize">{e.status}</span>
                  <p className="text-[14px] text-dusk">{fmtDate(e.createdAt)}</p>
                </div>
                {e.message && (
                  <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                    {e.message.length > 80
                      ? `${e.message.slice(0, 80).trimEnd()}...`
                      : e.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="xl:order-1 xl:row-span-2">
        <p className="eyebrow">Their details</p>
        <CustomerForm
          customer={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            area: customer.area,
            note: customer.note,
          }}
        />
      </section>
      </div>
    </main>
  );
}
