"use server";

import { revalidatePath, updateTag } from "next/cache";
import { and, count, eq, inArray, sql } from "drizzle-orm";
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
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    ? REGISTRY[entity as keyof typeof REGISTRY]
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

function cleanSlugs(ids: readonly string[]): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    const trimmed = String(id ?? "").trim();
    if (SLUG.test(trimmed)) out.add(trimmed);
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

function revalidateCatalogRooms(ids: readonly string[] = []) {
  revalidatePath("/admin");
  revalidatePath("/admin/pieces");
  revalidatePath("/admin/ranges");
  revalidatePath("/", "layout");
  updateTag("catalog");
  for (const id of ids) {
    revalidatePath(`/admin/pieces/${id}`);
    revalidatePath(`/piece/${id}`);
  }
}

function revalidateMediaRooms(ids: readonly string[] = []) {
  revalidateCatalogRooms();
  revalidatePath("/admin/media");
  for (const id of ids) revalidatePath(`/admin/media/${id}`);
}

/* What a permanent delete drags down with it. Foreign keys cascade in
   the schema: a customer takes their orders, and each order takes its
   payments and deliveries; an order takes its own payments and
   deliveries. previewDelete counts these before the door opens, so the
   desk can name the weight and the history line can record it. */
export type DeletePreview = {
  orders: number;
  payments: number;
  deliveries: number;
  pieces?: number;
  stock?: number;
  orderLines?: number;
  enquiries?: number;
  media?: number;
};

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

  if (entity === "piece") {
    return { ...empty, ...(await pieceCascadeCounts(ids)) };
  }

  if (entity === "range") {
    return { ...empty, ...(await rangeCascadeCounts(ids)) };
  }

  return empty;
}

async function pieceCascadeCounts(slugs: string[]) {
  if (slugs.length === 0) return {};
  const db = getDb();
  const [stock, orderLines, enquiries, media] = await Promise.all([
    db.select({ n: count() }).from(schema.stockLevels).where(inArray(schema.stockLevels.pieceSlug, slugs)),
    db.select({ n: count() }).from(schema.orderItems).where(inArray(schema.orderItems.pieceSlug, slugs)),
    db.select({ n: count() }).from(schema.enquiries).where(inArray(schema.enquiries.pieceSlug, slugs)),
    db.select({ n: count() }).from(schema.mediaAssets).where(inArray(schema.mediaAssets.pieceSlug, slugs)),
  ]);
  return {
    stock: stock[0]?.n ?? 0,
    orderLines: orderLines[0]?.n ?? 0,
    enquiries: enquiries[0]?.n ?? 0,
    media: media[0]?.n ?? 0,
  };
}

async function rangeCascadeCounts(rangeSlugs: string[]) {
  if (rangeSlugs.length === 0) return {};
  const pieceRows = await getDb()
    .select({ slug: schema.pieces.slug })
    .from(schema.pieces)
    .where(inArray(schema.pieces.rangeSlug, rangeSlugs));
  const slugs = pieceRows.map((row) => row.slug);
  return { pieces: slugs.length, ...(await pieceCascadeCounts(slugs)) };
}

/* The weight of the delete as one plain phrase for the history:
   "1 customer, 4 orders, 9 payments". Only the parts that carry a
   count are named. */
function magnitude(noun: string, n: number, c: DeletePreview): string {
  const parts = [`${n} ${plural(noun, n)}`];
  if (c.pieces) parts.push(`${c.pieces} ${c.pieces === 1 ? "piece" : "pieces"}`);
  if (c.stock) parts.push(`${c.stock} ${c.stock === 1 ? "stock row" : "stock rows"}`);
  if (c.orderLines) parts.push(`${c.orderLines} ${c.orderLines === 1 ? "order line" : "order lines"}`);
  if (c.enquiries) parts.push(`${c.enquiries} ${c.enquiries === 1 ? "enquiry" : "enquiries"}`);
  if (c.media) parts.push(`${c.media} ${c.media === 1 ? "photo link" : "photo links"}`);
  if (c.orders) parts.push(`${c.orders} ${c.orders === 1 ? "order" : "orders"}`);
  if (c.payments) parts.push(`${c.payments} ${c.payments === 1 ? "payment" : "payments"}`);
  if (c.deliveries) parts.push(`${c.deliveries} ${c.deliveries === 1 ? "delivery" : "deliveries"}`);
  return parts.join(", ");
}

async function archivePieces(ids: readonly string[]): Promise<RecordsResult> {
  const clean = cleanSlugs(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one stock item first." };

  try {
    await getDb()
      .update(schema.pieces)
      .set({ archivedAt: sql`now()`, updatedAt: sql`now()` })
      .where(inArray(schema.pieces.slug, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`archived ${clean.length} ${plural("stock item", clean.length)}`);
  revalidateCatalogRooms(clean);
  return { ok: true, message: `Archived ${clean.length} ${plural("stock item", clean.length)}.` };
}

async function restorePieces(ids: readonly string[]): Promise<RecordsResult> {
  const clean = cleanSlugs(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one stock item first." };

  try {
    await getDb()
      .update(schema.pieces)
      .set({ archivedAt: null, updatedAt: sql`now()` })
      .where(inArray(schema.pieces.slug, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`restored ${clean.length} ${plural("stock item", clean.length)}`);
  revalidateCatalogRooms(clean);
  return { ok: true, message: `Restored ${clean.length} ${plural("stock item", clean.length)}.` };
}

async function archiveRanges(ids: readonly string[]): Promise<RecordsResult> {
  const clean = cleanSlugs(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one range first." };

  try {
    await getDb()
      .update(schema.ranges)
      .set({ archivedAt: sql`now()` })
      .where(inArray(schema.ranges.slug, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`archived ${clean.length} ${plural("range", clean.length)}`);
  revalidateCatalogRooms();
  return { ok: true, message: `Archived ${clean.length} ${plural("range", clean.length)}.` };
}

async function restoreRanges(ids: readonly string[]): Promise<RecordsResult> {
  const clean = cleanSlugs(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one range first." };

  try {
    await getDb()
      .update(schema.ranges)
      .set({ archivedAt: null })
      .where(inArray(schema.ranges.slug, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`restored ${clean.length} ${plural("range", clean.length)}`);
  revalidateCatalogRooms();
  return { ok: true, message: `Restored ${clean.length} ${plural("range", clean.length)}.` };
}

async function clearMediaLiveSlots(ids: string[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const assets = await db
    .select({
      url: schema.mediaAssets.url,
      role: schema.mediaAssets.role,
      sun: schema.mediaAssets.sun,
      pieceSlug: schema.mediaAssets.pieceSlug,
    })
    .from(schema.mediaAssets)
    .where(inArray(schema.mediaAssets.id, ids));

  for (const asset of assets) {
    if (asset.role !== "card" || !asset.pieceSlug) continue;
    if (asset.sun === "night") {
      await db
        .update(schema.pieces)
        .set({ cardImageNight: null, updatedAt: sql`now()` })
        .where(and(eq(schema.pieces.slug, asset.pieceSlug), eq(schema.pieces.cardImageNight, asset.url)));
    }
    if (asset.sun === "day") {
      await db
        .update(schema.pieces)
        .set({ cardImageDay: null, updatedAt: sql`now()` })
        .where(and(eq(schema.pieces.slug, asset.pieceSlug), eq(schema.pieces.cardImageDay, asset.url)));
    }
  }
}

async function archiveMedia(ids: readonly string[]): Promise<RecordsResult> {
  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one photo first." };

  try {
    await clearMediaLiveSlots(clean);
    await getDb()
      .update(schema.mediaAssets)
      .set({ status: "archived", archivedAt: sql`now()`, updatedAt: sql`now()` })
      .where(inArray(schema.mediaAssets.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`archived ${clean.length} ${plural("photo", clean.length)}`);
  revalidateMediaRooms(clean);
  return { ok: true, message: `Archived ${clean.length} ${plural("photo", clean.length)}.` };
}

async function restoreMedia(ids: readonly string[]): Promise<RecordsResult> {
  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one photo first." };

  try {
    await getDb()
      .update(schema.mediaAssets)
      .set({ status: "draft", archivedAt: null, updatedAt: sql`now()` })
      .where(inArray(schema.mediaAssets.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`restored ${clean.length} ${plural("photo", clean.length)}`);
  revalidateMediaRooms(clean);
  return { ok: true, message: `Restored ${clean.length} ${plural("photo", clean.length)}.` };
}

async function deleteMedia(ids: readonly string[], confirm: boolean): Promise<RecordsResult> {
  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one photo first." };
  if (confirm !== true) return { ok: false, message: "Confirm the permanent delete first." };

  try {
    await clearMediaLiveSlots(clean);
    await getDb().delete(schema.mediaAssets).where(inArray(schema.mediaAssets.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(
    `permanently deleted ${clean.length} ${plural("photo", clean.length)}`,
    "",
    `${clean.length} ${plural("photo", clean.length)}`
  );
  revalidateMediaRooms(clean);
  return { ok: true, message: `Permanently deleted ${clean.length} ${plural("photo", clean.length)}.` };
}

async function deletePiecesForGood(slugs: string[]) {
  if (slugs.length === 0) return;
  const db = getDb();
  await db
    .update(schema.orderItems)
    .set({ pieceSlug: null })
    .where(inArray(schema.orderItems.pieceSlug, slugs));
  await db
    .update(schema.enquiries)
    .set({ pieceSlug: null })
    .where(inArray(schema.enquiries.pieceSlug, slugs));
  await db
    .update(schema.mediaAssets)
    .set({ pieceSlug: null, updatedAt: sql`now()` })
    .where(inArray(schema.mediaAssets.pieceSlug, slugs));
  await db.delete(schema.stockLevels).where(inArray(schema.stockLevels.pieceSlug, slugs));
  await db.delete(schema.pieces).where(inArray(schema.pieces.slug, slugs));
}

async function deletePieces(ids: readonly string[], confirm: boolean): Promise<RecordsResult> {
  const clean = cleanSlugs(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one stock item first." };
  if (confirm !== true) return { ok: false, message: "Confirm the permanent delete first." };

  let cascade: DeletePreview = { orders: 0, payments: 0, deliveries: 0 };
  try {
    cascade = await cascadeCounts("piece", clean);
    await deletePiecesForGood(clean);
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(
    `permanently deleted ${clean.length} ${plural("stock item", clean.length)}`,
    "",
    magnitude("stock item", clean.length, cascade)
  );
  revalidateCatalogRooms(clean);
  return {
    ok: true,
    message: `Permanently deleted ${clean.length} ${plural("stock item", clean.length)}.`,
  };
}

async function deleteRanges(ids: readonly string[], confirm: boolean): Promise<RecordsResult> {
  const clean = cleanSlugs(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one range first." };
  if (confirm !== true) return { ok: false, message: "Confirm the permanent delete first." };

  let pieceSlugs: string[] = [];
  let cascade: DeletePreview = { orders: 0, payments: 0, deliveries: 0 };
  try {
    const pieceRows = await getDb()
      .select({ slug: schema.pieces.slug })
      .from(schema.pieces)
      .where(inArray(schema.pieces.rangeSlug, clean));
    pieceSlugs = pieceRows.map((row) => row.slug);
    cascade = await cascadeCounts("range", clean);
    await deletePiecesForGood(pieceSlugs);
    await getDb().delete(schema.ranges).where(inArray(schema.ranges.slug, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(
    `permanently deleted ${clean.length} ${plural("range", clean.length)}`,
    "",
    magnitude("range", clean.length, cascade)
  );
  revalidateCatalogRooms(pieceSlugs);
  return { ok: true, message: `Permanently deleted ${clean.length} ${plural("range", clean.length)}.` };
}

export async function archiveRecords(
  entity: ArchivableEntity,
  ids: string[]
): Promise<RecordsResult> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  if (entity === "piece") return archivePieces(ids);
  if (entity === "range") return archiveRanges(ids);
  if (entity === "media") return archiveMedia(ids);

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

  if (entity === "piece") return restorePieces(ids);
  if (entity === "range") return restoreRanges(ids);
  if (entity === "media") return restoreMedia(ids);

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

  if (entity === "piece") return deletePieces(ids, confirm);
  if (entity === "range") return deleteRanges(ids, confirm);
  if (entity === "media") return deleteMedia(ids, confirm);

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

  if (entity === "piece" || entity === "range") {
    const clean = cleanSlugs(ids);
    if (clean.length === 0) return { ok: false, message: "Choose at least one record first." };
    try {
      return { ok: true, counts: await cascadeCounts(entity, clean) };
    } catch {
      return { ok: false, message: "The database did not answer. Try again." };
    }
  }

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
