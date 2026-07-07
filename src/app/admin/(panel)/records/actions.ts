"use server";

import { revalidatePath } from "next/cache";
import { count, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession, ownerOnly } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import type { ArchivableEntity, RecordsResult } from "./types";

/* Archive, restore, and permanent delete, one place for the whole
   ledger. Server actions are public HTTP endpoints whatever the UI
   hides, so every one re-checks the session before it touches a row.

   The owner relaxed the old "nothing is ever lost" rule. Archive is
   the safe default: archivedAt gets a timestamp and the row drops out
   of the working lists. Restore sets it back to null. Permanent delete
   removes the rows for good, and only when the caller passes
   confirm === true. Foreign keys cascade or set null in the schema, so
   deleting a customer never leaves an orphan and never blocks. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* A fixed allowlist maps each entity to its table and the rooms whose
   lists change when its rows move. No dynamic lookup, no eval: the
   entity string only ever indexes this object, so a bad value simply
   misses. */
const REGISTRY = {
  customer: { table: schema.customers, noun: "customer", rooms: ["/admin/customers"] },
  order: { table: schema.orders, noun: "order", rooms: ["/admin/orders"] },
  enquiry: { table: schema.enquiries, noun: "enquiry", rooms: ["/admin/customers"] },
  salesMotion: { table: schema.salesMotions, noun: "sales motion", rooms: ["/admin/customers"] },
  delivery: { table: schema.deliveries, noun: "delivery", rooms: ["/admin/deliveries"] },
  media: { table: schema.mediaAssets, noun: "media asset", rooms: ["/admin/media"] },
} as const;

function entry(entity: ArchivableEntity) {
  return Object.prototype.hasOwnProperty.call(REGISTRY, entity)
    ? REGISTRY[entity]
    : null;
}

/* Keep only well-formed uuids, and drop duplicates so the count the
   history records is the count of rows actually touched. */
function cleanIds(ids: readonly string[]): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    const trimmed = String(id ?? "").trim();
    if (UUID.test(trimmed)) out.add(trimmed);
  }
  return [...out];
}

function plural(noun: string, n: number) {
  return n === 1 ? noun : `${noun}s`;
}

function revalidateRooms(rooms: readonly string[]) {
  for (const room of rooms) revalidatePath(room);
  revalidatePath("/admin");
}

/* What a permanent delete drags down with it. Foreign keys cascade in
   the schema: a customer takes their orders, and each order takes its
   payments and deliveries; an order takes its own payments and
   deliveries. previewDelete counts these before the door opens, so the
   desk can name the weight and the history line can record it. */
export type DeletePreview = { orders: number; payments: number; deliveries: number };

export type PreviewResult =
  | { ok: true; counts: DeletePreview }
  | { ok: false; message: string };

/* Count the rows that will cascade for the given ids, touching none.
   Payments and deliveries hang off orders, not customers, so for a
   customer we reach them through the order ids. */
async function cascadeCounts(entity: ArchivableEntity, ids: string[]): Promise<DeletePreview> {
  const empty: DeletePreview = { orders: 0, payments: 0, deliveries: 0 };
  if (ids.length === 0) return empty;
  const db = getDb();

  if (entity === "customer") {
    const orderRows = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(inArray(schema.orders.customerId, ids));
    const orderIds = orderRows.map((r) => r.id);
    if (orderIds.length === 0) return empty;

    const [pay, del] = await Promise.all([
      db.select({ n: count() }).from(schema.payments).where(inArray(schema.payments.orderId, orderIds)),
      db.select({ n: count() }).from(schema.deliveries).where(inArray(schema.deliveries.orderId, orderIds)),
    ]);
    return { orders: orderIds.length, payments: pay[0]?.n ?? 0, deliveries: del[0]?.n ?? 0 };
  }

  if (entity === "order") {
    const [pay, del] = await Promise.all([
      db.select({ n: count() }).from(schema.payments).where(inArray(schema.payments.orderId, ids)),
      db.select({ n: count() }).from(schema.deliveries).where(inArray(schema.deliveries.orderId, ids)),
    ]);
    return { orders: 0, payments: pay[0]?.n ?? 0, deliveries: del[0]?.n ?? 0 };
  }

  return empty;
}

/* The weight of the delete as one plain phrase for the history:
   "1 customer, 4 orders, 9 payments". Only the parts that carry a
   count are named. */
function magnitude(noun: string, n: number, c: DeletePreview): string {
  const parts = [`${n} ${plural(noun, n)}`];
  if (c.orders) parts.push(`${c.orders} ${c.orders === 1 ? "order" : "orders"}`);
  if (c.payments) parts.push(`${c.payments} ${c.payments === 1 ? "payment" : "payments"}`);
  if (c.deliveries) parts.push(`${c.deliveries} ${c.deliveries === 1 ? "delivery" : "deliveries"}`);
  return parts.join(", ");
}

export async function archiveRecords(
  entity: ArchivableEntity,
  ids: string[]
): Promise<RecordsResult> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const reg = entry(entity);
  if (!reg) return { ok: false, message: "That kind of record cannot be archived." };

  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one record first." };

  try {
    await getDb()
      .update(reg.table)
      .set({ archivedAt: sql`now()` })
      .where(inArray(reg.table.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`archived ${clean.length} ${plural(reg.noun, clean.length)}`);
  revalidateRooms(reg.rooms);
  return {
    ok: true,
    message: `Archived ${clean.length} ${plural(reg.noun, clean.length)}.`,
  };
}

export async function restoreRecords(
  entity: ArchivableEntity,
  ids: string[]
): Promise<RecordsResult> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const reg = entry(entity);
  if (!reg) return { ok: false, message: "That kind of record cannot be restored." };

  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one record first." };

  try {
    await getDb()
      .update(reg.table)
      .set({ archivedAt: null })
      .where(inArray(reg.table.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`restored ${clean.length} ${plural(reg.noun, clean.length)}`);
  revalidateRooms(reg.rooms);
  return {
    ok: true,
    message: `Restored ${clean.length} ${plural(reg.noun, clean.length)}.`,
  };
}

export async function deleteRecords(
  entity: ArchivableEntity,
  ids: string[],
  confirm: boolean
): Promise<RecordsResult> {
  const refuse = await ownerOnly();
  if (refuse) return refuse;

  const reg = entry(entity);
  if (!reg) return { ok: false, message: "That kind of record cannot be deleted." };

  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one record first." };

  /* Permanent delete is a door that only opens on purpose. Without an
     explicit confirm the rows stay put. */
  if (confirm !== true) {
    return { ok: false, message: "Confirm the permanent delete first." };
  }

  /* Count the cascade before the rows are gone, so the history line can
     name the full weight of what left. */
  let cascade: DeletePreview;
  try {
    cascade = await cascadeCounts(entity, clean);
  } catch {
    cascade = { orders: 0, payments: 0, deliveries: 0 };
  }

  try {
    await getDb().delete(reg.table).where(inArray(reg.table.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(
    `permanently deleted ${clean.length} ${plural(reg.noun, clean.length)}`,
    "",
    magnitude(reg.noun, clean.length, cascade)
  );
  revalidateRooms(reg.rooms);
  return {
    ok: true,
    message: `Permanently deleted ${clean.length} ${plural(reg.noun, clean.length)}.`,
  };
}

/* A dry run for the desk: count what a permanent delete would drag down
   with the chosen rows, and hand it back, removing nothing. Owner only,
   like the delete it previews, so a staff key cannot even weigh the
   door. */
export async function previewDelete(
  entity: ArchivableEntity,
  ids: string[]
): Promise<PreviewResult> {
  const refuse = await ownerOnly();
  if (refuse) return refuse;

  const reg = entry(entity);
  if (!reg) return { ok: false, message: "That kind of record cannot be deleted." };

  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one record first." };

  try {
    return { ok: true, counts: await cascadeCounts(entity, clean) };
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
}
