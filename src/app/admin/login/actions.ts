"use server";

import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  OWNER,
  checkPassword,
  clearSession,
  hashStaffKey,
  setSession,
} from "@/lib/admin-auth";
import { countRecentFrom, logAction } from "@/lib/audit";

/* The door tries the master key first, then the staff table. Every
   refusal is written down under the caller's mark, and eight from one
   caller in ten minutes rest the door for that caller only. If the
   count cannot be read, the door rests closed, so a hiccup is never a
   free pass. */

const REFUSED = "was refused at the door";

/* Who is knocking, as a short hash of their address, so the door can
   count one caller's tries without keeping the address itself. Vercel
   sets the forwarded-for; the leftmost hop is the real caller. */
async function callerTag(): Promise<string> {
  const h = await headers();
  /* Prefer the platform-set real ip, which a caller cannot spoof; fall
     back to the leftmost forwarded hop, then to a shared bucket. */
  const real = h.get("x-real-ip")?.trim();
  const fwd = h.get("x-forwarded-for")?.split(",")[0].trim();
  const ip = real || fwd || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function login(_prev: { error: string } | null, form: FormData) {
  const tag = await callerTag();
  const refusals = await countRecentFrom(REFUSED, tag, 10);
  if (refusals === null || refusals >= 8) {
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

  await logAction(REFUSED, tag, "", "someone");
  return { error: "That is not the key to this house." };
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}
