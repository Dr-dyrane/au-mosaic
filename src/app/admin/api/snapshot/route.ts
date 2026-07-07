import { getDb, rowsOf, schema } from "@/db";
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { hasSession } from "@/lib/admin-auth";
import type {
  Snapshot,
  SnapshotOrder,
  SnapshotCustomer,
  SnapshotDelivery,
  SnapshotStock,
  SnapshotCatalogueItem,
  SnapshotEnquiry,
} from "@/lib/offline/types";

/* The field kit's one source of truth, captured whole. When a phone
   has signal it asks here once, and gets everything the last-known
   view needs to stand loud when the signal drops: who owes, what is
   open, what ships next, what is running low, the catalogue with its
   last given prices, and the enquiries still waiting for a first
   reply. Money is integer kobo, the house unit. Times leave as ISO
   strings so a saved record reads the same on every device.

   The balances here mirror the back office exactly. Open orders bill
   at the given price times quantity and subtract payments. Customer
   balances come from the same active-orders CTE the pulse uses, so a
   number on the field kit never disagrees with a number on the desk.
   The door is gated: no session, no snapshot. */

export const dynamic = "force-dynamic";

function iso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function isoOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return iso(v);
}

export async function GET() {
  if (!(await hasSession())) return new Response(null, { status: 401 });

  const db = getDb();
  const capturedAt = new Date().toISOString();

  /* Open orders: everything not settled and not archived, with the
     customer's name read off the join. */
  const openRows = await db
    .select({
      id: schema.orders.id,
      customerId: schema.orders.customerId,
      customerName: schema.customers.name,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(and(ne(schema.orders.status, "settled"), isNull(schema.orders.archivedAt)))
    .orderBy(desc(schema.orders.createdAt));

  /* Billed per order (given price times quantity) and paid per order,
     summed in the database and folded into Maps here. The aggregates
     can arrive as strings from the driver, so Number() every one. */
  const lineSums = await db
    .select({
      orderId: schema.orderItems.orderId,
      billed: sql<number>`sum(${schema.orderItems.givenPriceKobo} * ${schema.orderItems.quantity})`,
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

  const billedBy = new Map<string, number>();
  for (const r of lineSums) billedBy.set(r.orderId, Number(r.billed));
  const paidBy = new Map<string, number>();
  for (const r of paySums) paidBy.set(r.orderId, Number(r.paid));

  const openOrders: SnapshotOrder[] = openRows.map((o) => {
    const billedKobo = billedBy.get(o.id) ?? 0;
    const balanceKobo = billedKobo - (paidBy.get(o.id) ?? 0);
    return {
      id: o.id,
      customerId: o.customerId,
      customerName: o.customerName,
      status: o.status,
      billedKobo,
      balanceKobo,
      createdAt: iso(o.createdAt),
    };
  });

  /* Customers: every live person in the book. The balance is what is
     owed on active orders, from the same CTE the pulse reads, so the
     field kit and the desk never disagree. */
  const customerRows = await db
    .select({
      id: schema.customers.id,
      name: schema.customers.name,
      phone: schema.customers.phone,
      area: schema.customers.area,
    })
    .from(schema.customers)
    .where(isNull(schema.customers.archivedAt))
    .orderBy(asc(schema.customers.name));

  const balRows = rowsOf<{ customer_id: string; balance: number | string }>(
    await db.execute(sql`
      with active_orders as (
        select id, customer_id from orders
        where status not in ('enquiry','settled') and archived_at is null
      ),
      order_balances as (
        select o.customer_id,
          greatest(
            coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id),0)
            - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id),0),
          0)::bigint as balance
        from active_orders o
      )
      select customer_id, coalesce(sum(balance),0)::bigint as balance
      from order_balances group by customer_id
    `)
  );
  const balanceBy = new Map<string, number>();
  for (const r of balRows) balanceBy.set(r.customer_id, Number(r.balance));

  const lastOrderRows = rowsOf<{ customer_id: string; last: unknown }>(
    await db.execute(sql`select customer_id, max(created_at) as last from orders group by customer_id`)
  );
  const lastOrderBy = new Map<string, string | null>();
  for (const r of lastOrderRows) lastOrderBy.set(r.customer_id, isoOrNull(r.last));

  const customers: SnapshotCustomer[] = customerRows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    area: c.area,
    balanceKobo: balanceBy.get(c.id) ?? 0,
    lastOrderAt: lastOrderBy.get(c.id) ?? null,
  }));

  /* Deliveries still to run: pending or out, not archived, soonest
     first. The address defaults to empty when the row has none. */
  const deliveryRows = await db
    .select({
      id: schema.deliveries.id,
      orderId: schema.deliveries.orderId,
      customerName: schema.customers.name,
      status: schema.deliveries.status,
      scheduledFor: schema.deliveries.scheduledFor,
      address: schema.deliveries.address,
    })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(
      and(inArray(schema.deliveries.status, ["pending", "out"]), isNull(schema.deliveries.archivedAt))
    )
    .orderBy(asc(schema.deliveries.scheduledFor));

  const deliveries: SnapshotDelivery[] = deliveryRows.map((d) => ({
    id: d.id,
    orderId: d.orderId,
    customerName: d.customerName,
    status: d.status,
    scheduledFor: isoOrNull(d.scheduledFor),
    address: d.address ?? "",
  }));

  /* Low stock: a piece with a reorder floor set that has fallen to or
     below it. The piece name rides along from the join. */
  const stockRows = await db
    .select({
      pieceSlug: schema.stockLevels.pieceSlug,
      pieceName: schema.pieces.name,
      quantitySheets: schema.stockLevels.quantitySheets,
      reorderAt: schema.stockLevels.reorderAt,
    })
    .from(schema.stockLevels)
    .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
    .where(
      and(
        sql`${schema.stockLevels.reorderAt} > 0`,
        sql`${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`
      )
    );

  const lowStock: SnapshotStock[] = stockRows.map((s) => ({
    pieceSlug: s.pieceSlug,
    pieceName: s.pieceName,
    quantitySheets: s.quantitySheets,
    reorderAt: s.reorderAt,
  }));

  /* Catalogue: the published pieces, each with the price it last went
     out at. That last given price is worked out here in JS: read every
     order line with its order's date, then keep the newest line per
     slug. A slug never sold shows null. */
  const catalogueRows = await db
    .select({
      slug: schema.pieces.slug,
      name: schema.pieces.name,
      unit: schema.pieces.unit,
    })
    .from(schema.pieces)
    .where(eq(schema.pieces.published, true))
    .orderBy(asc(schema.pieces.name));

  const priceRows = await db
    .select({
      slug: schema.orderItems.pieceSlug,
      price: schema.orderItems.givenPriceKobo,
      at: schema.orders.createdAt,
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId));

  const latestPriceBy = new Map<string, { price: number; at: number }>();
  for (const r of priceRows) {
    if (!r.slug) continue;
    const at = r.at instanceof Date ? r.at.getTime() : new Date(String(r.at)).getTime();
    const seen = latestPriceBy.get(r.slug);
    if (!seen || at > seen.at) latestPriceBy.set(r.slug, { price: Number(r.price), at });
  }

  const catalogue: SnapshotCatalogueItem[] = catalogueRows.map((p) => ({
    slug: p.slug,
    name: p.name,
    unit: p.unit,
    lastGivenPriceKobo: latestPriceBy.get(p.slug)?.price ?? null,
  }));

  /* Fresh enquiries: the ones still marked new and not archived. The
     customer name is nullable, since an enquiry can arrive before a
     person is on file. */
  const enquiryRows = await db
    .select({
      id: schema.enquiries.id,
      customerName: schema.customers.name,
      message: schema.enquiries.message,
      createdAt: schema.enquiries.createdAt,
    })
    .from(schema.enquiries)
    .leftJoin(schema.customers, eq(schema.customers.id, schema.enquiries.customerId))
    .where(and(eq(schema.enquiries.status, "new"), isNull(schema.enquiries.archivedAt)))
    .orderBy(desc(schema.enquiries.createdAt));

  const freshEnquiries: SnapshotEnquiry[] = enquiryRows.map((e) => ({
    id: e.id,
    customerName: e.customerName ?? null,
    message: e.message,
    createdAt: iso(e.createdAt),
  }));

  const snapshot: Snapshot = {
    capturedAt,
    customers,
    openOrders,
    deliveries,
    lowStock,
    catalogue,
    freshEnquiries,
  };

  return Response.json(snapshot);
}
