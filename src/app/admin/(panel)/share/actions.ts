"use server";

import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* One quiet catch: what WhatsApp shared becomes an enquiry in the
   book, attached to the matched customer when there is one. Nothing
   is parsed twice; the page did the matching and passes it down. */

export type SaveState = { ok: boolean; message: string } | null;

export async function keepAsEnquiry(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const message = String(form.get("message") ?? "").trim().slice(0, 500);
  const customerId = String(form.get("customerId") ?? "").trim() || null;
  if (!message) return { ok: false, message: "Nothing was shared to keep." };

  try {
    await getDb().insert(schema.enquiries).values({
      source: "share",
      message,
      customerId,
    });
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("kept a shared chat as an enquiry");
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  return { ok: true, message: "Kept. It waits in Fresh from the window." };
}
