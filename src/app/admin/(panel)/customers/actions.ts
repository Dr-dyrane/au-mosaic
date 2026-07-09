"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession, ownerOnly } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { phone234 } from "@/lib/backoffice";
import {
  cleanSalesMotionKind,
  cleanSalesMotionStatus,
  salesMotionLabel,
} from "@/lib/sales-motions";

/* Server actions are public HTTP endpoints whatever the UI hides, so
   every one re-checks the session before touching the ledger. The
   database mints customer ids; nothing here invents them. And nothing
   is ever deleted: a customer, once written, stays in the book. */

export type SaveState = { ok: boolean; message: string } | null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function dateOrNull(raw: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export async function createCustomer(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const name = text(form, "name");
  if (!name) return { ok: false, message: "The customer needs a name." };

  const phone = text(form, "phone");
  const db = getDb();
  let id = "";
  try {
    /* Phone is the key: one number, one person. Match the normalised
       form against the live book before writing, so a second card for
       the same line never opens. An empty phone has no key to match. */
    if (phone) {
      const key = phone234(phone);
      const live = await db
        .select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone })
        .from(schema.customers)
        .where(isNull(schema.customers.archivedAt));
      const match = live.find((c) => c.phone && phone234(c.phone) === key);
      if (match) {
        return { ok: false, message: `This number already belongs to ${match.name}. Open their record instead.` };
      }
    }

    const [row] = await db
      .insert(schema.customers)
      .values({
        name,
        phone,
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

/* Two cards, one number: history splits and a debt can hide in the
   seam. Folding moves every order, enquiry, and sales motion onto the
   card he keeps, then archives the twin. Nothing is deleted; the twin
   rests in the archive and the history signs the move. The gate is
   the phone key itself, so only true twins fold. The writes run in a
   safe order: records first, archive last, and a fold that stops
   midway simply runs again. */
export async function foldCustomer(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const keepId = text(form, "keepId");
  const foldId = text(form, "foldId");
  if (!UUID.test(keepId) || !UUID.test(foldId) || keepId === foldId) {
    return { ok: false, message: "Choose the two cards first." };
  }

  let keptName = "";
  let foldedName = "";
  let story = "";
  try {
    const db = getDb();
    const cards = await db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        archivedAt: schema.customers.archivedAt,
      })
      .from(schema.customers)
      .where(inArray(schema.customers.id, [keepId, foldId]));
    const keep = cards.find((c) => c.id === keepId);
    const fold = cards.find((c) => c.id === foldId);
    if (!keep || !fold) return { ok: false, message: "That person is not in the book." };
    if (keep.archivedAt || fold.archivedAt) {
      return { ok: false, message: "An archived card does not fold. Restore it first." };
    }
    if (!keep.phone || !fold.phone || phone234(keep.phone) !== phone234(fold.phone)) {
      return { ok: false, message: "Those two cards do not share a number." };
    }

    const movedOrders = await db
      .update(schema.orders)
      .set({ customerId: keepId })
      .where(eq(schema.orders.customerId, foldId))
      .returning({ id: schema.orders.id });
    const movedEnquiries = await db
      .update(schema.enquiries)
      .set({ customerId: keepId })
      .where(eq(schema.enquiries.customerId, foldId))
      .returning({ id: schema.enquiries.id });
    const movedMotions = await db
      .update(schema.salesMotions)
      .set({ customerId: keepId })
      .where(eq(schema.salesMotions.customerId, foldId))
      .returning({ id: schema.salesMotions.id });
    await db
      .update(schema.customers)
      .set({ archivedAt: sql`now()` })
      .where(eq(schema.customers.id, foldId));

    const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    story = [
      part(movedOrders.length, "order", "orders"),
      part(movedEnquiries.length, "enquiry", "enquiries"),
      part(movedMotions.length, "motion", "motions"),
    ].join(", ") + " moved";
    keptName = keep.name;
    foldedName = fold.name;
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("folded a duplicate customer", keptName, `${foldedName} folded in: ${story}`);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${keepId}`);
  revalidatePath(`/admin/customers/${foldId}`);
  revalidatePath("/admin/debts");
  revalidatePath("/admin");
  return { ok: true, message: `Folded. ${foldedName}'s records now live on this card.` };
}

/* The right to be forgotten, NDPR-lite. The money history is the
   business's lawful book and stays; the person leaves it. One owner
   action clears their name, number, and words everywhere they live:
   the card, their enquiry messages and session ids, their delivery
   addresses and notes, their motion notes, their order notes. The
   card archives as Forgotten. The audit book stays append-only by
   law and gains one unnamed line for this act. The card clears last,
   so a forget that stops midway simply runs again. */
export async function forgetCustomer(_prev: SaveState, form: FormData): Promise<SaveState> {
  const refusal = await ownerOnly();
  if (refusal) return refusal;

  const id = text(form, "id");
  if (!UUID.test(id)) return { ok: false, message: "Missing customer." };

  try {
    const db = getDb();
    const [card] = await db
      .select({ id: schema.customers.id, name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, id));
    if (!card) return { ok: false, message: "That person is not in the book." };

    const theirOrders = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(eq(schema.orders.customerId, id));
    const orderIds = theirOrders.map((o) => o.id);

    await db
      .update(schema.enquiries)
      .set({ message: "", sessionId: null })
      .where(eq(schema.enquiries.customerId, id));
    if (orderIds.length > 0) {
      await db
        .update(schema.deliveries)
        .set({ address: "", note: "" })
        .where(inArray(schema.deliveries.orderId, orderIds));
      await db
        .update(schema.orders)
        .set({ note: "" })
        .where(inArray(schema.orders.id, orderIds));
    }
    await db
      .update(schema.salesMotions)
      .set({ note: "" })
      .where(eq(schema.salesMotions.customerId, id));
    await db
      .update(schema.customers)
      .set({ name: "Forgotten", phone: "", area: "", note: "", archivedAt: sql`now()` })
      .where(eq(schema.customers.id, id));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  /* The one line the history keeps carries no name, on purpose. */
  await logAction("forgot a customer", "", "their card, words, and addresses were cleared; the money history stands");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/debts");
  revalidatePath("/admin");
  return { ok: true, message: "Forgotten. The money history stands, without them in it." };
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

export async function addSalesMotion(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const customerId = text(form, "customerId");
  const kind = cleanSalesMotionKind(text(form, "kind"));
  if (!UUID.test(customerId)) return { ok: false, message: "Missing customer." };
  if (!kind) return { ok: false, message: "Choose the motion." };

  let name = "";
  try {
    const db = getDb();
    const [customer] = await db
      .select({ name: schema.customers.name })
      .from(schema.customers)
      .where(eq(schema.customers.id, customerId));
    if (!customer) return { ok: false, message: "That person is not in the book." };
    name = customer.name;
    await db.insert(schema.salesMotions).values({
      customerId,
      kind,
      note: text(form, "note"),
      scheduledFor: dateOrNull(text(form, "scheduledFor")),
    });
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("added a sales motion", name, salesMotionLabel(kind));
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin");
  return { ok: true, message: `${salesMotionLabel(kind)} added.` };
}

export async function setSalesMotionStatus(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const id = text(form, "id");
  const status = cleanSalesMotionStatus(text(form, "status"));
  if (!UUID.test(id)) return { ok: false, message: "Choose a motion first." };
  if (!status) return { ok: false, message: "Choose open or done." };

  let customerId = "";
  let detail = "";
  try {
    const db = getDb();
    const [row] = await db
      .select({
        motion: schema.salesMotions,
        customerName: schema.customers.name,
      })
      .from(schema.salesMotions)
      .innerJoin(schema.customers, eq(schema.customers.id, schema.salesMotions.customerId))
      .where(eq(schema.salesMotions.id, id));
    if (!row) return { ok: false, message: "That motion is not in the book." };
    customerId = row.motion.customerId;
    detail = `${row.customerName}: ${salesMotionLabel(row.motion.kind)}`;
    await db
      .update(schema.salesMotions)
      .set({
        status,
        completedAt: status === "done" ? sql`now()` : null,
        updatedAt: sql`now()`,
      })
      .where(eq(schema.salesMotions.id, id));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(status === "done" ? "finished a sales motion" : "reopened a sales motion", detail);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin");
  return { ok: true, message: status === "done" ? "Marked done." : "Reopened." };
}
