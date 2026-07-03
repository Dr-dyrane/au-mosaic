"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  OWNER,
  checkPassword,
  clearSession,
  hashStaffKey,
  setSession,
} from "@/lib/admin-auth";
import { countRecent, logAction } from "@/lib/audit";

/* The door tries the master key first, then the staff table. Every
   refusal is written down, and eight refusals in ten minutes rest
   the door awhile. If the history table has not landed yet, the
   door stays kind and simply cannot count. */

const REFUSED = "was refused at the door";

export async function login(_prev: { error: string } | null, form: FormData) {
  if ((await countRecent(REFUSED, 10)) >= 8) {
    return { error: "The door rests a moment. Try again shortly." };
  }

  const password = String(form.get("password") ?? "");

  if (checkPassword(password)) {
    await setSession(OWNER);
    await logAction("opened the door", "", "", OWNER.name);
    redirect("/admin");
  }

  /* Not the master key: perhaps a named one. The lookup hides inside
     try so a missing table cannot crash the door; the redirect lives
     outside, because redirects throw on purpose. */
  let staff: { id: string; name: string; role: "owner" | "staff" } | null = null;
  if (password.length >= 6) {
    try {
      const [row] = await getDb()
        .select({ id: schema.staff.id, name: schema.staff.name, role: schema.staff.role })
        .from(schema.staff)
        .where(and(eq(schema.staff.keyHash, hashStaffKey(password)), eq(schema.staff.active, true)));
      staff = row ?? null;
    } catch {}
  }
  if (staff) {
    await setSession({ id: staff.id, name: staff.name, role: staff.role });
    await logAction("opened the door", "", "", staff.name);
    redirect("/admin");
  }

  await logAction(REFUSED, "", "", "someone");
  return { error: "That is not the key to this house." };
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}
