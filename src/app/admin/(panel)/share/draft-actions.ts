"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { parseNaira } from "@/lib/backoffice";
import { aiConfigured, AiError } from "@/lib/ai/client";
import { chatToDraft } from "@/lib/ai/chat-to-draft";
import { loadCatalog, lastGivenPriceKobo } from "@/lib/ai/catalog";
import { extractChatText } from "@/lib/whatsapp/read-upload";
import type { OrderDraft } from "@/lib/ai/types";
import type { CreatePayload, DraftState } from "./draft-types";

/* Server actions are public endpoints whatever the UI hides, so each
   re-checks the session. Reading is the AI's whole job; creating is
   the owner's, through the same order writes the book already uses.
   Price is never the model's: it is seeded from the ledger and set by
   hand. Nothing is deleted; a wrong line is dropped from a draft that
   was never saved. */

/* Read shared or pasted words, or an uploaded export, into a draft.
   The file, when present, is opened first (a .zip yields its
   _chat.txt). Every matched line carries its catalogue name and the
   last price the owner gave, from the book. */
export async function draftFromIntake(_prev: DraftState, form: FormData): Promise<DraftState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  if (!aiConfigured()) {
    return { ok: false, message: "The reader is not set up yet. Type the order in by hand." };
  }

  let raw = "";
  const file = form.get("chat");
  if (file && typeof file !== "string" && file.size > 0) {
    try {
      raw = extractChatText(new Uint8Array(await file.arrayBuffer()));
    } catch {
      return { ok: false, message: "That file did not open as a chat. Paste the words instead." };
    }
  } else {
    raw = String(form.get("text") ?? "");
  }
  if (!raw.trim()) return { ok: false, message: "Paste a chat, or add the exported file first." };

  let draft: OrderDraft;
  try {
    const catalog = await loadCatalog();
    draft = await chatToDraft({ raw, catalog });
    const nameBySlug = new Map(catalog.map((p) => [p.slug, p.name]));
    for (const line of draft.lines) {
      if (!line.pieceSlug) continue;
      line.pieceName = nameBySlug.get(line.pieceSlug);
      const kobo = await lastGivenPriceKobo(line.pieceSlug);
      if (kobo != null) line.listPriceKobo = kobo;
    }
  } catch (err) {
    if (err instanceof AiError) {
      return { ok: false, message: "The reader could not answer. Try again, or type it in." };
    }
    return { ok: false, message: "The database did not answer. Try again." };
  }

  if (draft.lines.length === 0) {
    return { ok: true, message: "Nothing to buy was found in that. Add a line by hand.", draft };
  }
  return { ok: true, message: "", draft };
}

/* Turn a confirmed draft into a real order. Attaches to the matched
   customer, or writes a new one first. Each line becomes an order
   item at the price the owner set; the customer's open enquiries
   close by themselves, as they do when any order opens. */
export async function createOrderFromDraft(
  payload: CreatePayload
): Promise<{ ok: boolean; message: string }> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const lines = (payload.lines ?? []).filter(
    (l) => (l.pieceSlug || l.description.trim()) && Number.isFinite(l.quantity) && l.quantity > 0
  );
  if (lines.length === 0) return { ok: false, message: "Add at least one line first." };

  const db = getDb();
  let customerId = payload.customerId?.trim() ?? "";
  let orderId = "";
  try {
    if (!customerId) {
      const name = payload.newCustomer?.name.trim() ?? "";
      if (!name) return { ok: false, message: "Give the customer a name first." };
      const [person] = await db
        .insert(schema.customers)
        .values({
          name,
          phone: payload.newCustomer?.phone.trim() ?? "",
          area: payload.newCustomer?.area.trim() ?? "",
        })
        .returning({ id: schema.customers.id });
      customerId = person.id;
      await logAction("added a customer", name);
    }

    const [order] = await db
      .insert(schema.orders)
      .values({ customerId, note: "Read from a WhatsApp chat" })
      .returning({ id: schema.orders.id });
    orderId = order.id;

    for (const l of lines) {
      const kobo = parseNaira(l.givenPrice);
      await db.insert(schema.orderItems).values({
        orderId,
        pieceSlug: l.pieceSlug || null,
        description: l.description.trim(),
        quantity: Math.round(l.quantity),
        listPriceKobo: kobo,
        givenPriceKobo: kobo,
      });
    }

    await db
      .update(schema.enquiries)
      .set({ status: "converted" })
      .where(
        sql`${schema.enquiries.customerId} = ${customerId} and ${schema.enquiries.status} in ('new', 'replied')`
      );
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("read a chat into an order", `order ${orderId.slice(0, 8)}`, `${lines.length} lines`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  redirect(`/admin/orders/${orderId}`);
}
