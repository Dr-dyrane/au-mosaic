"use server";

import { revalidatePath } from "next/cache";
import { inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
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
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const reg = entry(entity);
  if (!reg) return { ok: false, message: "That kind of record cannot be deleted." };

  const clean = cleanIds(ids);
  if (clean.length === 0) return { ok: false, message: "Choose at least one record first." };

  /* Permanent delete is a door that only opens on purpose. Without an
     explicit confirm the rows stay put. */
  if (confirm !== true) {
    return { ok: false, message: "Confirm the permanent delete first." };
  }

  try {
    await getDb().delete(reg.table).where(inArray(reg.table.id, clean));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction(`permanently deleted ${clean.length} ${plural(reg.noun, clean.length)}`);
  revalidateRooms(reg.rooms);
  return {
    ok: true,
    message: `Permanently deleted ${clean.length} ${plural(reg.noun, clean.length)}.`,
  };
}
