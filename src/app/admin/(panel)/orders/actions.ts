"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { naira, parseNaira } from "@/lib/backoffice";
import { sendPush } from "@/lib/push";
import { PIPELINE, STATUS_LABEL, type OrderStatus } from "./pipeline";

/* Server actions are public HTTP endpoints whatever the UI hides, so
   every one re-checks the session before touching the ledger. Nothing
   here deletes: a wrong line gets a corrected line beside it, and the
   book keeps both. Money crosses in naira and lives in kobo. */

export type SaveState = { ok: boolean; message: string } | null;

const METHODS = ["transfer", "cash", "POS"] as const;
const RETURN_SETTLEMENTS = ["credit", "refund"] as const;

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/settled");
  revalidatePath("/admin");
}

export async function createOrder(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const customerId = String(form.get("customerId") ?? "").trim();
  if (!customerId) return { ok: false, message: "Pick a customer first." };

  const db = getDb();
  let id = "";
  try {
    const [row] = await db
      .insert(schema.orders)
      .values({ customerId, note: String(form.get("note") ?? "").trim() })
      .returning({ id: schema.orders.id });
    id = row.id;
    /* The funnel closes its loop by itself: this customer's open
       enquiries become converted the moment an order opens. */
    await db
      .update(schema.enquiries)
      .set({ status: "converted" })
      .where(
        sql`${schema.enquiries.customerId} = ${customerId} and ${schema.enquiries.status} in ('new', 'replied')`
      );
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("opened an order", `order ${id.slice(0, 8)}`);
  refresh(id);
  redirect(`/admin/orders/${id}`);
}

/* Delivered is the moment stock leaves the building, so that is the
   moment the book counts it: crossing into delivered takes each
   line's quantity off its piece, never below zero, and walking back
   out returns it. Every movement signs the history, and a piece
   pushed across its warn-me-at line answers in the same sentence
   and taps the owner's phone. */
const OUT_THE_DOOR: readonly OrderStatus[] = ["delivered", "settled"];

type Crossing = { name: string; qty: number; unit: string; slug: string };
type StockMove = {
  action: "took stock for a delivery" | "returned stock to the shelf";
  detail: string;
};

export async function setStatus(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const id = String(form.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing order." };

  const raw = String(form.get("status") ?? "");
  if (!(PIPELINE as readonly string[]).includes(raw)) {
    return { ok: false, message: "That is not a step." };
  }
  const status = raw as OrderStatus;

  const db = getDb();
  const crossings: Crossing[] = [];
  const moved: StockMove[] = [];
  try {
    const [before] = await db
      .select({ status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, id));
    if (!before) return { ok: false, message: "That order is not in the book." };

    /* The write insists on the status it read, the deliveries
       pattern: two thumbs racing the same move cannot both win,
       so stock can never be taken off the shelf twice. */
    const movedRows = await db
      .update(schema.orders)
      .set({ status, updatedAt: sql`now()` })
      .where(and(eq(schema.orders.id, id), eq(schema.orders.status, before.status)))
      .returning({ id: schema.orders.id });
    if (movedRows.length === 0) {
      return { ok: false, message: "That order has already moved on. Refresh and look again." };
    }

    const wasOut = OUT_THE_DOOR.includes(before.status);
    const nowOut = OUT_THE_DOOR.includes(status);
    if (wasOut !== nowOut) {
      const lines = await db
        .select({
          pieceSlug: schema.orderItems.pieceSlug,
          quantity: schema.orderItems.quantity,
        })
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, id));

      const byPiece = new Map<string, number>();
      for (const line of lines) {
        if (!line.pieceSlug || line.quantity === 0) continue;
        byPiece.set(line.pieceSlug, (byPiece.get(line.pieceSlug) ?? 0) + line.quantity);
      }

      for (const [pieceSlug, quantity] of byPiece) {
        if (quantity === 0) continue;
        const [row] = await db
          .select({
            qty: schema.stockLevels.quantitySheets,
            reorderAt: schema.stockLevels.reorderAt,
            name: schema.pieces.name,
            unit: schema.pieces.unit,
          })
          .from(schema.stockLevels)
          .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
          .where(eq(schema.stockLevels.pieceSlug, pieceSlug));
        if (!row) continue;

        /* Positive net quantity means the order took stock. Negative
           can only happen after correction lines, and moves the other
           way. Never below the visible truth. */
        const stockChange = nowOut ? -quantity : quantity;
        const after = Math.max(0, row.qty + stockChange);
        await db
          .update(schema.stockLevels)
          .set({ quantitySheets: after, updatedAt: sql`now()` })
          .where(eq(schema.stockLevels.pieceSlug, pieceSlug));

        moved.push({
          action: stockChange < 0 ? "took stock for a delivery" : "returned stock to the shelf",
          detail:
            stockChange < 0
              ? `${row.name}: ${Math.abs(quantity)} ${row.unit} out, ${after} left`
              : `${row.name}: ${Math.abs(quantity)} ${row.unit} back, ${after} on hand`,
        });
        /* A threshold of zero is no threshold; it never cries wolf. */
        if (stockChange < 0 && row.reorderAt > 0 && row.qty > row.reorderAt && after <= row.reorderAt) {
          crossings.push({ name: row.name, qty: after, unit: row.unit, slug: pieceSlug });
        }
      }
    }
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("moved an order", `order ${id.slice(0, 8)}`, `to ${STATUS_LABEL[status].toLowerCase()}`);
  for (const m of moved) {
    await logAction(
      m.action,
      `order ${id.slice(0, 8)}`,
      m.detail
    );
  }
  /* A crossing taps the phone; the digest never repeats it louder. */
  for (const c of crossings) {
    await sendPush({
      title: "Running low",
      body: `${c.name}: ${c.qty} ${c.unit} left.`,
      url: `/admin/pieces/${c.slug}`,
    });
  }

  refresh(id);
  revalidatePath("/admin/pieces");
  if (crossings.length > 0) {
    const first = crossings[0];
    const more = crossings.length - 1;
    return {
      ok: true,
      message: `Delivered. ${first.name} is running low: ${first.qty} ${first.unit} left.${
        more > 0 ? ` And ${more} more.` : ""
      }`,
    };
  }
  return { ok: true, message: `Moved to ${STATUS_LABEL[status].toLowerCase()}.` };
}

export async function addLine(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const orderId = String(form.get("orderId") ?? "");
  if (!orderId) return { ok: false, message: "Missing order." };

  const pieceSlug = String(form.get("pieceSlug") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!pieceSlug && !description) {
    return { ok: false, message: "Pick a piece or describe the item." };
  }

  const quantity = parseInt(String(form.get("quantity") ?? ""), 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { ok: false, message: "Quantity starts at one." };
  }

  const listPriceKobo = parseNaira(String(form.get("listPrice") ?? ""));
  const givenRaw = String(form.get("givenPrice") ?? "").trim();
  const givenPriceKobo = givenRaw ? parseNaira(givenRaw) : listPriceKobo;

  const db = getDb();
  try {
    await db.insert(schema.orderItems).values({
      orderId,
      pieceSlug: pieceSlug || null,
      description,
      quantity,
      listPriceKobo,
      givenPriceKobo,
    });
    await db
      .update(schema.orders)
      .set({ updatedAt: sql`now()` })
      .where(eq(schema.orders.id, orderId));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(
    "added an item",
    `order ${orderId.slice(0, 8)}`,
    `${quantity} x ${description || pieceSlug} at ${naira(givenPriceKobo)}`
  );
  refresh(orderId);
  return { ok: true, message: "Item added." };
}

export async function addReturn(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const orderId = String(form.get("orderId") ?? "");
  const itemId = String(form.get("itemId") ?? "");
  if (!orderId || !itemId) return { ok: false, message: "Choose the item that came back." };

  const quantity = parseInt(String(form.get("quantity") ?? ""), 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { ok: false, message: "Return at least one." };
  }

  const settlement = String(form.get("settlement") ?? "");
  if (!(RETURN_SETTLEMENTS as readonly string[]).includes(settlement)) {
    return { ok: false, message: "Choose credit or refund." };
  }

  const note = String(form.get("note") ?? "").trim();
  const db = getDb();
  let detail = "";
  let movedStock = "";
  try {
    const [source] = await db
      .select({
        item: schema.orderItems,
        orderStatus: schema.orders.status,
        pieceName: schema.pieces.name,
        unit: schema.pieces.unit,
        stockQty: schema.stockLevels.quantitySheets,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
      .leftJoin(schema.pieces, eq(schema.pieces.slug, schema.orderItems.pieceSlug))
      .leftJoin(schema.stockLevels, eq(schema.stockLevels.pieceSlug, schema.orderItems.pieceSlug))
      .where(and(eq(schema.orderItems.id, itemId), eq(schema.orderItems.orderId, orderId)));

    if (!source) return { ok: false, message: "That item is not on this order." };
    if (source.item.returnForItemId || source.item.quantity <= 0) {
      return { ok: false, message: "Choose the original sale item." };
    }

    const [returned] = await db
      .select({
        qty: sql<number>`coalesce(sum(case when ${schema.orderItems.quantity} < 0 then -${schema.orderItems.quantity} else 0 end), 0)`,
      })
      .from(schema.orderItems)
      .where(and(eq(schema.orderItems.orderId, orderId), eq(schema.orderItems.returnForItemId, itemId)));

    const returnedQty = Number(returned?.qty ?? 0);
    const left = source.item.quantity - returnedQty;
    if (left <= 0) return { ok: false, message: "That item has already come back." };
    if (quantity > left) {
      return { ok: false, message: `Only ${left} can still come back.` };
    }

    const lineName = source.pieceName ?? (source.item.description || "Order item");
    const unit = source.unit ?? "units";
    const returnValueKobo = source.item.givenPriceKobo * quantity;
    await db.insert(schema.orderItems).values({
      orderId,
      pieceSlug: source.item.pieceSlug,
      description: `Return: ${lineName}${note ? `, ${note}` : ""}`,
      quantity: -quantity,
      listPriceKobo: source.item.listPriceKobo,
      givenPriceKobo: source.item.givenPriceKobo,
      returnForItemId: itemId,
    });

    if (settlement === "refund") {
      await db.insert(schema.payments).values({
        orderId,
        amountKobo: -returnValueKobo,
        method: "refund",
        note: note || `Return: ${lineName}`,
      });
    }

    if (source.item.pieceSlug && OUT_THE_DOOR.includes(source.orderStatus)) {
      const after = Number(source.stockQty ?? 0) + quantity;
      await db
        .update(schema.stockLevels)
        .set({ quantitySheets: after, updatedAt: sql`now()` })
        .where(eq(schema.stockLevels.pieceSlug, source.item.pieceSlug));
      movedStock = `${lineName}: ${quantity} ${unit} back, ${after} on hand`;
    }

    await db
      .update(schema.orders)
      .set({ updatedAt: sql`now()` })
      .where(eq(schema.orders.id, orderId));

    detail = `${quantity} ${unit} of ${lineName}; ${settlement === "refund" ? "refunded" : "kept as credit"} ${naira(returnValueKobo)}`;
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("recorded a return", `order ${orderId.slice(0, 8)}`, detail);
  if (movedStock) {
    await logAction("returned stock to the shelf", `order ${orderId.slice(0, 8)}`, movedStock);
  }
  refresh(orderId);
  revalidatePath("/admin/pieces");
  return {
    ok: true,
    message: settlement === "refund" ? "Returned and refunded." : "Returned. The customer has credit.",
  };
}

export async function addPayment(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const orderId = String(form.get("orderId") ?? "");
  if (!orderId) return { ok: false, message: "Missing order." };

  const amountKobo = parseNaira(String(form.get("amount") ?? ""));
  if (amountKobo <= 0) return { ok: false, message: "The payment needs an amount." };

  const method = String(form.get("method") ?? "");
  if (!(METHODS as readonly string[]).includes(method)) {
    return { ok: false, message: "Pick how the money came in." };
  }

  const db = getDb();
  try {
    await db.insert(schema.payments).values({
      orderId,
      amountKobo,
      method,
      note: String(form.get("note") ?? "").trim(),
    });
    await db
      .update(schema.orders)
      .set({ updatedAt: sql`now()` })
      .where(eq(schema.orders.id, orderId));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("recorded a payment", `order ${orderId.slice(0, 8)}`, `${naira(amountKobo)} by ${method}`);
  refresh(orderId);
  return { ok: true, message: "Payment recorded." };
}
