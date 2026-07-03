"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { parseNaira } from "@/lib/backoffice";
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
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  refresh(id);
  redirect(`/admin/orders/${id}`);
}

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
  try {
    const rows = await db
      .update(schema.orders)
      .set({ status, updatedAt: sql`now()` })
      .where(eq(schema.orders.id, id))
      .returning({ id: schema.orders.id });
    if (rows.length === 0) return { ok: false, message: "That order is not in the book." };
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  refresh(id);
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

  refresh(orderId);
  return { ok: true, message: "Payment recorded." };
}
