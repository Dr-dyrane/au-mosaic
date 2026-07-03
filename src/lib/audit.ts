import { and, count, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { whoAmI } from "./admin-auth";

/* The book's history writes itself: who did what, when, in
   sentences. Append-only by law 8. Never throws: a missed line of
   history must never block the work it records, and before the
   audit table lands (npm run db:push) every call is a quiet no-op. */

export async function logAction(action: string, subject = "", detail = "", who?: string) {
  try {
    const name = who ?? (await whoAmI())?.name ?? "the owner";
    await getDb().insert(schema.auditLog).values({
      who: name,
      action: action.slice(0, 80),
      subject: subject.slice(0, 120),
      detail: detail.slice(0, 300),
    });
  } catch {}
}

/* How often something happened lately; the door's patience reads
   this. Fails open: no table yet means a count of zero. */
export async function countRecent(action: string, minutes: number): Promise<number> {
  try {
    /* Safe for sql.raw: mins is truncated from a code-supplied
       integer, never from a request. */
    const mins = Math.max(1, Math.trunc(minutes));
    const [row] = await getDb()
      .select({ n: count() })
      .from(schema.auditLog)
      .where(
        and(
          eq(schema.auditLog.action, action),
          gt(schema.auditLog.at, sql`now() - ${sql.raw(`interval '${mins} minutes'`)}`)
        )
      );
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}
