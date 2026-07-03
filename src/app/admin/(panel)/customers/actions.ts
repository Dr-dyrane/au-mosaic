"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

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

  await logAction("added a customer", name);
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

  await logAction("saved a customer", name);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}

/* A window tap gets a name: the enquiry ties to a customer, and the
   funnel learns who it was. Attaching never changes the status; the
   desk still clears with Replied or Close, and an order marks it
   converted by itself. */
export async function attachEnquiry(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const id = String(form.get("id") ?? "");
  const customerId = String(form.get("customerId") ?? "");
  if (!id || !customerId) return { ok: false, message: "Missing enquiry or person." };

  let name = "";
  try {
    const db = getDb();
    const [person] = await db
      .select({ name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, customerId));
    if (!person) return { ok: false, message: "That person is not in the book." };
    await db
      .update(schema.enquiries)
      .set({ customerId })
      .where(eq(schema.enquiries.id, id));
    name = person.name;
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("attached an enquiry", name);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  return { ok: true, message: `Tied to ${name}.` };
}

/* Fresh enquiries clear from the desk: replied or closed, nothing
   deleted. */
export async function setEnquiryStatus(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const id = String(form.get("id") ?? "");
  const to = String(form.get("to") ?? "");
  if (!id || (to !== "replied" && to !== "closed")) {
    return { ok: false, message: "Missing enquiry or answer." };
  }
  try {
    await getDb()
      .update(schema.enquiries)
      .set({ status: to })
      .where(eq(schema.enquiries.id, id));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction(to === "replied" ? "marked an enquiry replied" : "closed an enquiry");
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  return { ok: true, message: "Cleared." };
}
