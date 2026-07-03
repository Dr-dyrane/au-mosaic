"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";

/* Server actions are public HTTP endpoints whatever the UI hides, so
   every one re-checks the session before touching the ledger. A
   delivery only ever walks forward one step, pending to out to
   delivered, and where it stands comes from the database, never from
   the screen that asked. */

export type SaveState = { ok: boolean; message: string } | null;

export async function createDelivery(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const orderId = String(form.get("orderId") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  const driver = String(form.get("driver") ?? "").trim();
  const scheduledRaw = String(form.get("scheduledFor") ?? "").trim();
  if (!orderId) return { ok: false, message: "Pick the order this delivery belongs to." };
  if (!address) return { ok: false, message: "The driver needs an address." };

  const db = getDb();
  try {
    await db.insert(schema.deliveries).values({
      orderId,
      address,
      driver,
      scheduledFor: scheduledRaw || null,
    });
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  revalidatePath("/admin/deliveries");
  revalidatePath("/admin");
  redirect("/admin/deliveries");
}

export async function setDeliveryStatus(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const id = String(form.get("id") ?? "").trim();
  const to = String(form.get("to") ?? "").trim();
  if (!id || (to !== "out" && to !== "delivered")) {
    return { ok: false, message: "That is not a step this room takes." };
  }

  const db = getDb();
  try {
    const [row] = await db
      .select()
      .from(schema.deliveries)
      .where(eq(schema.deliveries.id, id));
    if (!row) return { ok: false, message: "That delivery is not in the book." };

    /* One step forward only: pending goes out, out gets delivered. */
    const expected = to === "out" ? "pending" : "out";
    if (row.status !== expected) {
      return { ok: false, message: "That delivery has already moved on. Refresh and look again." };
    }

    await db
      .update(schema.deliveries)
      .set(
        to === "delivered"
          ? { status: "delivered", deliveredAt: sql`now()` }
          : { status: "out" }
      )
      .where(eq(schema.deliveries.id, id));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  revalidatePath("/admin/deliveries");
  revalidatePath("/admin");
  return { ok: true, message: to === "delivered" ? "Landed." : "On the road." };
}
