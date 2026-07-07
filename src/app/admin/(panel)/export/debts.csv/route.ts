import { and, asc, eq, isNull, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { csvLine, csvResponse, nairaPlain, ymd } from "../csv";

/* Who owes what, printed: one row per debtor, oldest forgotten
   first, the same truth the ledger room shows. Balance is billed
   minus paid on live orders only, never stored, never stale. */

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasSession())) {
    return new Response(null, { status: 302, headers: { location: "/admin/login" } });
  }

  const db = getDb();
  const liveOrders = await db
    .select({
      id: schema.orders.id,
      createdAt: schema.orders.createdAt,
      customerId: schema.customers.id,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
    })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(and(notInArray(schema.orders.status, ["enquiry", "settled"]), isNull(schema.orders.archivedAt)))
    .orderBy(asc(schema.orders.createdAt));

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

  const billed = new Map(billedRows.map((r) => [r.orderId, Number(r.billed)]));
  const paid = new Map(paidRows.map((r) => [r.orderId, Number(r.paid)]));

  type Debtor = { name: string; phone: string; oldest: Date; owing: number; total: number };
  const byCustomer = new Map<string, Debtor>();
  for (const o of liveOrders) {
    const balance = (billed.get(o.id) ?? 0) - (paid.get(o.id) ?? 0);
    if (balance <= 0) continue;
    let d = byCustomer.get(o.customerId);
    if (!d) {
      d = { name: o.customerName, phone: o.customerPhone, oldest: o.createdAt, owing: 0, total: 0 };
      byCustomer.set(o.customerId, d);
    }
    d.owing += 1;
    d.total += balance;
  }

  const debtors = [...byCustomer.values()].sort(
    (a, b) => new Date(a.oldest).getTime() - new Date(b.oldest).getTime()
  );

  const lines = [
    csvLine(["Customer", "Phone", "Oldest debt", "Open orders owing", "Balance (naira)"]),
    ...debtors.map((d) =>
      csvLine([d.name, d.phone, ymd(d.oldest), d.owing, nairaPlain(d.total)])
    ),
  ];

  return csvResponse("debts", lines);
}
