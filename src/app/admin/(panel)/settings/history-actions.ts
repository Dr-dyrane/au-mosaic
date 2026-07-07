"use server";

import { revalidatePath } from "next/cache";
import { lt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ownerOnly } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* Clearing the book's history. The record is append-only by law 8, so
   nothing edits a line; but the owner may wipe the whole record for a
   clean start, or trim everything before a date. Both ask the owner
   first, because a server action is a public endpoint whatever the UI
   hides, and a staff key must not erase the ledger's memory. After a
   wipe, one line is written so the act of clearing signs its own name. */

export type SaveState = { ok: boolean; message: string } | null;

/* Empty the whole record, then sign the clearing itself so the first
   line of the fresh history is the wipe that made it. If the form
   carries a "confirm" value it must read "clear"; a bare submit with no
   confirm field still clears, so a plain button keeps working. */
export async function clearHistory(_prev: SaveState, form: FormData): Promise<SaveState> {
  const refuse = await ownerOnly();
  if (refuse) return refuse;

  const confirm = form.get("confirm");
  if (confirm !== null && String(confirm).trim() !== "clear") {
    return { ok: false, message: "Type clear to empty the whole history." };
  }

  try {
    await getDb().delete(schema.auditLog);
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  /* Sign the clearing itself, so the first line of the fresh history is
     the wipe that made it. Written after the delete, it survives. */
  await logAction("cleared the history");
  revalidatePath("/admin/settings/history");
  return { ok: true, message: "The history is empty." };
}

/* Trim the record: drop every line older than the given date, keep the
   rest. The date is a plain YYYY-MM-DD from the form; anything else is
   refused before a row is touched. */
export async function clearHistoryBefore(_prev: SaveState, form: FormData): Promise<SaveState> {
  const refuse = await ownerOnly();
  if (refuse) return refuse;

  const before = String(form.get("before") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before)) {
    return { ok: false, message: "Pick a date first, as YYYY-MM-DD." };
  }
  const cutoff = new Date(`${before}T00:00:00.000Z`);
  if (Number.isNaN(cutoff.getTime())) {
    return { ok: false, message: "That is not a date. Try again." };
  }

  try {
    await getDb().delete(schema.auditLog).where(lt(schema.auditLog.at, cutoff));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  /* Sign the trim, and note the cutoff it kept back to. */
  await logAction("cleared the history", "", `before ${before}`);
  revalidatePath("/admin/settings/history");
  return { ok: true, message: `Cleared everything before ${before}.` };
}
