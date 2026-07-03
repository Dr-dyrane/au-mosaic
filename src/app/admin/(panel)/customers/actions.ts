"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";

/* Server actions are public HTTP endpoints whatever the UI hides, so
   every one re-checks the session before touching the ledger. The
   database mints customer ids; nothing here invents them. And nothing
   is ever deleted: a customer, once written, stays in the book. */

export type SaveState = { ok: boolean; message: string } | null;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function createCustomer(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const name = text(form, "name");
  if (!name) return { ok: false, message: "The customer needs a name." };

  const db = getDb();
  let id = "";
  try {
    const [row] = await db
      .insert(schema.customers)
      .values({
        name,
        phone: text(form, "phone"),
        area: text(form, "area"),
        note: text(form, "note"),
      })
      .returning({ id: schema.customers.id });
    id = row.id;
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin");

  /* redirect throws on purpose, so it lives outside the try. */
  redirect(`/admin/customers/${id}`);
}

export async function saveCustomer(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const id = text(form, "id");
  const name = text(form, "name");
  if (!id) return { ok: false, message: "Missing customer." };
  if (!name) return { ok: false, message: "The customer needs a name." };

  const db = getDb();
  try {
    await db
      .update(schema.customers)
      .set({
        name,
        phone: text(form, "phone"),
        area: text(form, "area"),
        note: text(form, "note"),
      })
      .where(eq(schema.customers.id, id));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}
