"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";

/* House facts, saved as key and value. Only known keys are written;
   a stranger's form invents nothing. */

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
  revalidatePath("/admin/settings");
  return { ok: true, message: "Saved. The site picks these up when it reads the book." };
}
