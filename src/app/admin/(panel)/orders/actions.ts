"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
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

export async function setStatus(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const id = String(form.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing order." };

  const raw = String(form.get("status") ?? "");
  if (!(PIPELINE as readonly string[]).includes(raw)) {
    return { ok: false, message: "That is not a step on this line." };
  }
  const status = raw as OrderStatus;

  const db = getDb();
  const crossings: Crossing[] = [];
  const moved: string[] = [];
  try {
    const [before] = await db
      .select({ status: schema.orders.status })
      .from(schema.orders)
      .where(eq(schema.orders.id, id));
    if (!before) return { ok: false, message: "That order is not in the book." };

    await db
      .update(schema.orders)
      .set({ status, updatedAt: sql`now()` })
      .where(eq(schema.orders.id, id));

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

      for (const line of lines) {
        if (!line.pieceSlug || line.quantity <= 0) continue;
        const [row] = await db
          .select({
            qty: schema.stockLevels.quantitySheets,
            reorderAt: schema.stockLevels.reorderAt,
            name: schema.pieces.name,
            unit: schema.pieces.unit,
          })
          .from(schema.stockLevels)
          .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
          .where(eq(schema.stockLevels.pieceSlug, line.pieceSlug));
        if (!row) continue;

        /* Never below the visible truth. */
        const after = nowOut
          ? Math.max(0, row.qty - line.quantity)
          : row.qty + line.quantity;
        await db
          .update(schema.stockLevels)
          .set({ quantitySheets: after, updatedAt: sql`now()` })
          .where(eq(schema.stockLevels.pieceSlug, line.pieceSlug));

        moved.push(
          nowOut
            ? `${row.name}: ${line.quantity} ${row.unit} out, ${after} left`
            : `${row.name}: ${line.quantity} ${row.unit} back, ${after} on hand`
        );
        /* A threshold of zero is no threshold; it never cries wolf. */
        if (nowOut && row.reorderAt > 0 && row.qty > row.reorderAt && after <= row.reorderAt) {
          crossings.push({ name: row.name, qty: after, unit: row.unit, slug: line.pieceSlug });
        }
      }
    }
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("moved an order", `order ${id.slice(0, 8)}`, `to ${STATUS_LABEL[status].toLowerCase()}`);
  for (const m of moved) {
    await logAction(
      OUT_THE_DOOR.includes(status) ? "took stock for a delivery" : "returned stock to the shelf",
      `order ${id.slice(0, 8)}`,
      m
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
    return { ok: false, message: "Pick a piece or describe the line." };
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
    "added a line",
    `order ${orderId.slice(0, 8)}`,
    `${quantity} x ${description || pieceSlug} at ${naira(givenPriceKobo)}`
  );
  refresh(orderId);
  return { ok: true, message: "Line added." };
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
