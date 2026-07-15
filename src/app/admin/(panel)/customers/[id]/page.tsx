import Link from "next/link";
import { notFound } from "next/navigation";
import { count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { whoAmI } from "@/lib/admin-auth";
import { naira, phone234, waChat } from "@/lib/backoffice";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { salesMotionLabel } from "@/lib/sales-motions";
import CustomerForm from "./CustomerForm";
import FoldTwins, { type Twin } from "./FoldTwins";
import ForgetCustomer from "./ForgetCustomer";
import SalesMotions from "./SalesMotions";
import Back from "../../Back";
import Teach from "../../Teach";
import { STATUS_LABEL } from "../../orders/pipeline";
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
  const isOwner = (await whoAmI())?.role === "owner";

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

  /* The story strip reads two more small sets: their payments and
     their deliveries, both reached through their orders. */
  const paymentRows = await db
    .select({
      id: schema.payments.id,
      orderId: schema.payments.orderId,
      amountKobo: schema.payments.amountKobo,
      paidAt: schema.payments.paidAt,
    })
    .from(schema.payments)
    .innerJoin(schema.orders, eq(schema.payments.orderId, schema.orders.id))
    .where(eq(schema.orders.customerId, id));

  const deliveryRows = await db
    .select({
      id: schema.deliveries.id,
      orderId: schema.deliveries.orderId,
      status: schema.deliveries.status,
      scheduledFor: schema.deliveries.scheduledFor,
      deliveredAt: schema.deliveries.deliveredAt,
    })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.deliveries.orderId, schema.orders.id))
    .where(eq(schema.orders.customerId, id));

  const motions = await db
    .select()
    .from(schema.salesMotions)
    .where(eq(schema.salesMotions.customerId, id))
    .orderBy(
      sql`case when ${schema.salesMotions.status} = 'open' then 0 else 1 end`,
      desc(schema.salesMotions.createdAt)
    );

  /* Twins: live cards sharing this card's phone key. The same
     normalised match the creation doors use, so what they refuse to
     create, this page offers to fold. Counts ride along so the
     consequence card can name exactly what moves. */
  let twins: Twin[] = [];
  if (customer.phone && !customer.archivedAt) {
    const key = phone234(customer.phone);
    const live = await db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
      })
      .from(schema.customers)
      .where(isNull(schema.customers.archivedAt));
    const cards = live.filter((c) => c.id !== id && c.phone && phone234(c.phone) === key);
    if (cards.length > 0) {
      const twinIds = cards.map((c) => c.id);
      const [orderCounts, enquiryCounts, motionCounts] = await Promise.all([
        db
          .select({ cid: schema.orders.customerId, n: count() })
          .from(schema.orders)
          .where(inArray(schema.orders.customerId, twinIds))
          .groupBy(schema.orders.customerId),
        db
          .select({ cid: schema.enquiries.customerId, n: count() })
          .from(schema.enquiries)
          .where(inArray(schema.enquiries.customerId, twinIds))
          .groupBy(schema.enquiries.customerId),
        db
          .select({ cid: schema.salesMotions.customerId, n: count() })
          .from(schema.salesMotions)
          .where(inArray(schema.salesMotions.customerId, twinIds))
          .groupBy(schema.salesMotions.customerId),
      ]);
      const by = (rows: { cid: string | null; n: number }[]) =>
        new Map(rows.map((r) => [r.cid ?? "", r.n]));
      const o = by(orderCounts);
      const e = by(enquiryCounts);
      const m = by(motionCounts);
      twins = cards.map((c) => ({
        id: c.id,
        name: c.name,
        orders: o.get(c.id) ?? 0,
        enquiries: e.get(c.id) ?? 0,
        motions: m.get(c.id) ?? 0,
      }));
    }
  }

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
  /* Their story: one strip of time. Orders opening, money arriving,
     vans landing, motions noted, enquiries coming in, and the day the
     card itself opened. The data already lived in this room; here it
     stands in one line, newest first. The book's history stays the
     house-wide ledger; this is one person's thread. */
  type StoryEvent = { key: string; at: Date; text: string; href?: string };
  const story: StoryEvent[] = [];
  story.push({
    key: `card-${customer.id}`,
    at: new Date(customer.createdAt),
    text: "The card opened",
  });
  for (const o of orders) {
    const billed = billedBy.get(o.id) ?? 0;
    story.push({
      key: `order-${o.id}`,
      at: new Date(o.createdAt),
      text: billed > 0 ? `An order opened, ${naira(billed)} billed` : "An order opened",
      href: `/admin/orders/${o.id}`,
    });
  }
  for (const p of paymentRows) {
    story.push({
      key: `pay-${p.id}`,
      at: new Date(p.paidAt),
      text:
        p.amountKobo < 0
          ? `${naira(Math.abs(p.amountKobo))} refunded`
          : `${naira(p.amountKobo)} received`,
      href: `/admin/orders/${p.orderId}`,
    });
  }
  for (const d of deliveryRows) {
    const at = d.deliveredAt ?? d.scheduledFor;
    if (!at) continue;
    story.push({
      key: `del-${d.id}`,
      at: new Date(at),
      text: d.deliveredAt
        ? "The delivery landed"
        : d.status === "out"
          ? "A delivery went out"
          : "A delivery was set",
      href: `/admin/orders/${d.orderId}`,
    });
  }
  for (const e of enquiries) {
    story.push({
      key: `enq-${e.id}`,
      at: new Date(e.createdAt),
      text: e.status === "converted" ? "An enquiry came in, later converted" : "An enquiry came in",
    });
  }
  for (const m of motions) {
    story.push({
      key: `mot-${m.id}`,
      at: new Date(m.createdAt),
      text: `${salesMotionLabel(m.kind)} noted`,
    });
    if (m.completedAt) {
      story.push({
        key: `mot-done-${m.id}`,
        at: new Date(m.completedAt),
        text: `${salesMotionLabel(m.kind)} done`,
      });
    }
  }
  story.sort((a, b) => b.at.getTime() - a.at.getTime());
  const STORY_CAP = 40;
  const storyShown = story.slice(0, STORY_CAP);

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
                    <span className="chip-solid">{STATUS_LABEL[o.status] ?? o.status}</span>
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

      {storyShown.length > 1 && (
        <section className="xl:order-5">
          <p className="eyebrow">Their story</p>
          <ol className="mt-4 grid gap-2.5">
            {storyShown.map((e) => (
              <li key={e.key} className="flex items-baseline justify-between gap-4">
                {e.href ? (
                  <Link href={e.href} className="link-hair text-[14px]">
                    {e.text}
                  </Link>
                ) : (
                  <p className="text-[14px] text-ink">{e.text}</p>
                )}
                <span className="whitespace-nowrap text-[12px] text-mist">{fmtDate(e.at)}</span>
              </li>
            ))}
          </ol>
          {story.length > STORY_CAP && (
            <p className="mt-4 text-[13px] text-dusk">
              The older story stays in the rooms above.
            </p>
          )}
        </section>
      )}

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
        {twins.length > 0 && (
          <div className="mt-12">
            <p className="eyebrow">Same number</p>
            <Teach until="people">
              <p className="mt-3 text-[14px] leading-relaxed text-dusk">
                {twins.length === 1
                  ? "Another card shares this number."
                  : "Other cards share this number."}{" "}
                One person, one card: fold the twin onto this one and every
                order, enquiry, and motion follows. The folded card rests in
                the archive.
              </p>
            </Teach>
            <FoldTwins keepId={customer.id} twins={twins} />
          </div>
        )}
        {isOwner && customer.name !== "Forgotten" && (
          <ForgetCustomer id={customer.id} name={customer.name} />
        )}
      </section>
      </div>
    </main>
  );
}
