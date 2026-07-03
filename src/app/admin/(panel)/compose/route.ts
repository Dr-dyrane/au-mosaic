import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { naira, waChat } from "@/lib/backoffice";

/* Compose from the book: a quote or a receipt, read fresh from the
   order at the moment of sending, never from the screen. The link
   walks straight into the customer's WhatsApp with the message
   prefilled; the book writes a line of history on the way out. */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function go(location: string) {
  return new Response(null, { status: 302, headers: { location } });
}

export async function GET(req: Request) {
  if (!(await hasSession())) return go("/admin/login");

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const orderId = url.searchParams.get("order") ?? "";
  if ((kind !== "quote" && kind !== "receipt") || !UUID.test(orderId)) {
    return go("/admin/orders");
  }

  const db = getDb();
  const [row] = await db
    .select({ order: schema.orders, customer: schema.customers })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(eq(schema.orders.id, orderId));
  if (!row) return go("/admin/orders");
  if (!row.customer.phone) return go(`/admin/orders/${orderId}`);

  const lines = await db
    .select({ item: schema.orderItems, pieceName: schema.pieces.name })
    .from(schema.orderItems)
    .leftJoin(schema.pieces, eq(schema.pieces.slug, schema.orderItems.pieceSlug))
    .where(eq(schema.orderItems.orderId, orderId));

  const pays = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, orderId))
    .orderBy(asc(schema.payments.paidAt));

  const billed = lines.reduce((s, l) => s + l.item.givenPriceKobo * l.item.quantity, 0);
  const paid = pays.reduce((s, p) => s + p.amountKobo, 0);
  const balance = billed - paid;

  const lineText = lines
    .map(
      (l) =>
        `${l.item.quantity} x ${l.pieceName ?? (l.item.description || "Custom work")}: ${naira(
          l.item.givenPriceKobo * l.item.quantity
        )}`
    )
    .join("\n");

  const name = row.customer.name.split(" ")[0];
  const message =
    kind === "quote"
      ? [
          `Good day ${name}. Your quote from AU Mosaic.`,
          "",
          lineText || "We will price the work on your order page.",
          "",
          `Billed: ${naira(billed)}`,
          paid > 0 ? `Paid so far: ${naira(paid)}\nBalance: ${naira(balance)}` : null,
          "",
          "Thank you.",
        ]
          .filter((s) => s !== null)
          .join("\n")
      : [
          `Good day ${name}. Your receipt from AU Mosaic.`,
          "",
          `Received: ${naira(paid)}`,
          `Billed: ${naira(billed)}`,
          balance > 0 ? `Balance: ${naira(balance)}` : "Settled in full. Thank you for your trust.",
          "",
          "Thank you.",
        ].join("\n");

  await logAction(
    kind === "quote" ? "composed a quote" : "composed a receipt",
    `order ${orderId.slice(0, 8)}`,
    `for ${row.customer.name}`
  );

  return go(waChat(row.customer.phone, message));
}
