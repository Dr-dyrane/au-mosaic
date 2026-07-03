import { sql } from "drizzle-orm";
import { getDb, rowsOf } from "./index";

/* Deploys heal their own schema. At boot, one probe asks whether the
   newest tables and columns are in the book; when they are, this
   costs a single query and leaves. When they are not, the pending
   statements apply themselves, each tolerating already-exists, so
   racing cold starts cannot hurt each other and a half-healed book
   finishes healing. db:push retires as an owner errand: future
   schema passes append their DDL here beside the drizzle file, and
   the next deploy carries it. Fails silent and open by law: a book
   that cannot heal still opens, and the rooms teach. */

const DDL: string[] = [
  /* 0003 · staff and the book's history */
  `CREATE TABLE "audit_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "at" timestamp with time zone DEFAULT now() NOT NULL,
    "who" text DEFAULT 'the owner' NOT NULL,
    "action" text NOT NULL,
    "subject" text DEFAULT '' NOT NULL,
    "detail" text DEFAULT '' NOT NULL
  )`,
  `CREATE TABLE "staff" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "role" text DEFAULT 'staff' NOT NULL,
    "key_hash" text NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX "audit_at_idx" ON "audit_log" USING btree ("at")`,
  `CREATE INDEX "audit_action_idx" ON "audit_log" USING btree ("action")`,
  /* 0004 · the funnel learns people */
  `ALTER TABLE "enquiries" ADD COLUMN "session_id" text`,
  /* 0005 · the phones that asked to be told */
  `CREATE TABLE "push_subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "endpoint" text NOT NULL,
    "p256dh" text NOT NULL,
    "auth" text NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
  )`,
];

let healed = false;

export async function healSchema(): Promise<void> {
  if (healed || !process.env.DATABASE_URL) return;
  try {
    const db = getDb();
    const probe = await db.execute(sql`
      select to_regclass('public.staff') as staff,
             to_regclass('public.push_subscriptions') as push,
             (select 1 from information_schema.columns
                where table_name = 'enquiries' and column_name = 'session_id') as sid`);
    const row = rowsOf<{ staff: string | null; push: string | null; sid: number | null }>(probe)[0];
    if (row?.staff && row?.push && row?.sid) {
      healed = true;
      return;
    }
    for (const stmt of DDL) {
      try {
        await db.execute(sql.raw(stmt));
        console.log("[schema] applied:", stmt.replace(/\s+/g, " ").slice(0, 56));
      } catch (e) {
        const m = String(e);
        if (!/already exists|duplicate/i.test(m)) {
          console.error("[schema] statement failed:", m.slice(0, 200));
        }
      }
    }
    healed = true;
    console.log("[schema] the book is current");
  } catch (e) {
    console.error("[schema] probe failed:", String(e).slice(0, 200));
  }
}
