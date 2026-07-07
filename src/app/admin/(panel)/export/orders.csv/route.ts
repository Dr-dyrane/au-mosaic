import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hideDemoByNote, getDataMode } from "@/lib/data-mode";
import { hasSession } from "@/lib/admin-auth";
import { csvLine, csvResponse, nairaPlain, ymd } from "../csv";

/* Every order as one accountant-ready row: opened, customer, status,
   billed, paid, balance, note. Newest first, all statuses, plain
   naira numbers. A GET link, no script: the book prints itself. */

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasSession())) {
    return new Response(null, { status: 302, headers: { location: "/admin/login" } });
  }

  const db = getDb();
  const mode = await getDataMode();
  const orders = await db
    .select({
      id: schema.orders.id,
      createdAt: schema.orders.createdAt,
      status: schema.orders.status,
      note: schema.orders.note,
      customer: schema.customers.name,
    })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(and(hideDemoByNote(mode, schema.orders.note)))
    .orderBy(desc(schema.orders.createdAt));

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

  const billedBy = new Map(lineSums.map((r) => [r.orderId, Number(r.billed)]));
  const paidBy = new Map(paySums.map((r) => [r.orderId, Number(r.paid)]));

  const lines = [
    csvLine(["Opened", "Customer", "Status", "Billed (naira)", "Paid (naira)", "Balance (naira)", "Note"]),
    ...orders.map((o) => {
      const billed = billedBy.get(o.id) ?? 0;
      const paid = paidBy.get(o.id) ?? 0;
      return csvLine([
        ymd(o.createdAt),
        o.customer,
        o.status,
        nairaPlain(billed),
        nairaPlain(paid),
        nairaPlain(billed - paid),
        o.note,
      ]);
    }),
  ];

  return csvResponse("orders", lines);
}
