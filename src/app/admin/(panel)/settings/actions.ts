"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession, hashStaffKey, whoAmI } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* House facts, saved as key and value. Only known keys are written;
   a stranger's form invents nothing. The key rack lives here too:
   only the owner hands keys out or takes them back, and a key never
   leaves the book, it only goes inactive. */

export type SaveState = { ok: boolean; message: string } | null;

const KEYS = ["whatsapp", "phone_display", "hours", "location", "instagram"] as const;

export async function saveSettings(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const db = getDb();
  try {
    for (const key of KEYS) {
      const raw = form.get(key);
      if (raw === null) continue;
      let value = String(raw).trim();
      if (key === "whatsapp") {
        value = value.replace(/\D/g, "");
        if (value.startsWith("0")) value = `234${value.slice(1)}`;
      }
      await db
        .insert(schema.settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: schema.settings.key,
          set: { value, updatedAt: sql`now()` },
        });
    }
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("saved the house facts");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Saved. The site picks these up when it reads the book." };
}

/* Only the owner hands out keys. */
async function ownerOnly(): Promise<SaveState> {
  const who = await whoAmI();
  if (!who) return { ok: false, message: "Signed out. Sign in again." };
  if (who.role !== "owner") return { ok: false, message: "Only the owner hands out keys." };
  return null;
}

export async function addStaff(_prev: SaveState, form: FormData): Promise<SaveState> {
  const refuse = await ownerOnly();
  if (refuse) return refuse;

  const name = String(form.get("name") ?? "").trim();
  const key = String(form.get("key") ?? "");
  if (!name) return { ok: false, message: "The key needs a name on it." };
  if (key.length < 6) return { ok: false, message: "A key needs at least six characters." };

  const db = getDb();
  try {
    const keyHash = hashStaffKey(key);
    const [taken] = await db
      .select({ id: schema.staff.id })
      .from(schema.staff)
      .where(eq(schema.staff.keyHash, keyHash));
    if (taken) return { ok: false, message: "That key is already someone's. Pick another." };

    await db.insert(schema.staff).values({ name, keyHash });
  } catch {
    return {
      ok: false,
      message: "The staff table is not in the book yet. Run npm run db:push, then try again.",
    };
  }
  await logAction("gave a key to", name);
  revalidatePath("/admin/settings");
  return { ok: true, message: `${name} can open the door now.` };
}

/* This phone asks to be told: the browser's subscription lands here.
   Turning it off leaves the row inactive; nothing is deleted. */
export async function savePushSubscription(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const endpoint = String(form.get("endpoint") ?? "");
  const p256dh = String(form.get("p256dh") ?? "");
  const auth = String(form.get("auth") ?? "");
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    return { ok: false, message: "That subscription is not whole. Try the toggle again." };
  }
  try {
    await getDb()
      .insert(schema.pushSubscriptions)
      .values({ endpoint, p256dh, auth, active: true })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: { p256dh, auth, active: true },
      });
  } catch {
    return {
      ok: false,
      message: "The subscriptions table is not in the book yet. Run npm run db:push, then try again.",
    };
  }
  await logAction("asked this phone to be told");
  return { ok: true, message: "This phone will be told." };
}

export async function dropPushSubscription(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const endpoint = String(form.get("endpoint") ?? "");
  if (!endpoint) return { ok: false, message: "Missing subscription." };
  try {
    await getDb()
      .update(schema.pushSubscriptions)
      .set({ active: false })
      .where(eq(schema.pushSubscriptions.endpoint, endpoint));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("quieted this phone");
  return { ok: true, message: "This phone rests." };
}

export async function setStaffActive(_prev: SaveState, form: FormData): Promise<SaveState> {
  const refuse = await ownerOnly();
  if (refuse) return refuse;

  const id = String(form.get("id") ?? "");
  const to = String(form.get("to") ?? "");
  if (!id || (to !== "on" && to !== "off")) return { ok: false, message: "Missing key or state." };

  const db = getDb();
  let name = "";
  try {
    const rows = await db
      .update(schema.staff)
      .set({ active: to === "on" })
      .where(and(eq(schema.staff.id, id)))
      .returning({ name: schema.staff.name });
    if (rows.length === 0) return { ok: false, message: "That key is not in the book." };
    name = rows[0].name;
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction(to === "on" ? "returned the key to" : "took back the key from", name);
  revalidatePath("/admin/settings");
  return { ok: true, message: to === "on" ? `${name} is back in.` : `${name}'s key no longer turns.` };
}
