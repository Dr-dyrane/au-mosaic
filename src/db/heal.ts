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
  /* Correction · the instagram placeholder becomes the real handle.
     Guarded by its own predicate, so it runs once and never again;
     the probe stops asking the moment the row is right. */
  `UPDATE settings SET value = 'https://www.instagram.com/aumosaic'
     WHERE key = 'instagram' AND value = 'https://instagram.com'`,
  /* 2026-07-04 · Nonso's green: ten SKUs from his own Instagram
     trade language enter the book, insert-only so nothing existing
     can be touched. Counts start at zero and warn-at zero: the
     shelves are his to fill. */
  `INSERT INTO pieces (slug, range_slug, name, line, colors, image_night, image_day, sort) VALUES
    ('plain-blue-small-seed', 'pool-mosaics', 'Plain blue mosaic', 'Small seed, the pool classic', '["#1553b8","#1e63c8","#2f79dc","#4a8fe8"]'::jsonb, '/media/plain-blue-small-seed-night.jpg', '/media/plain-blue-small-seed-day.jpg', 20),
    ('mixed-blue-big-seed', 'pool-mosaics', 'Mixed blue mosaic', 'Big seed, deep to light in one sheet', '["#0d3a8a","#1e63c8","#3aa9d6","#7fc4ec","#b7e0f6"]'::jsonb, '/media/mixed-blue-big-seed-night.jpg', '/media/mixed-blue-big-seed-day.jpg', 21),
    ('tiny-seed-gold', 'glass-mosaics', 'Tiny seed gold mosaic', 'Tiny seed, stocked in quantity', '["#8a6d1a","#b8942d","#d9b64a","#edd27a"]'::jsonb, '/media/tiny-seed-gold-night.jpg', '/media/tiny-seed-gold-day.jpg', 20),
    ('silver-crystal-mosaic', 'glass-mosaics', 'Silver crystal mosaic', 'A premium reflective finish', '["#c9cdd4","#dde1e7","#eef1f5","#b7bcc4"]'::jsonb, '/media/silver-crystal-mosaic-night.jpg', '/media/silver-crystal-mosaic-day.jpg', 21),
    ('plain-white-mosaic', 'glass-mosaics', 'Plain white mosaic', 'Clean light for walls and pools', '["#f6f7f8","#eceff1","#e2e6ea","#d7dde2"]'::jsonb, '/media/plain-white-mosaic-night.jpg', '/media/plain-white-mosaic-day.jpg', 22),
    ('black-mosaic', 'glass-mosaics', 'Black mosaic', 'Shadow-deep, matte or gloss', '["#0d0f12","#16191d","#212529","#2c3136"]'::jsonb, '/media/black-mosaic-night.jpg', '/media/black-mosaic-day.jpg', 23),
    ('green-mosaic', 'glass-mosaics', 'Green mosaic', 'Kitchens, baths, and courtyards', '["#1c8a4a","#27a35a","#3cba6e","#66d08e"]'::jsonb, '/media/green-mosaic-night.jpg', '/media/green-mosaic-day.jpg', 24),
    ('orange-mosaic', 'glass-mosaics', 'Orange mosaic', 'A warm accent colourway', '["#e07020","#f08430","#f89a4a","#ffb066"]'::jsonb, '/media/orange-mosaic-night.jpg', '/media/orange-mosaic-day.jpg', 25),
    ('stone-mosaic', 'feature-mosaics', 'Stone mosaic', 'Matte stone for quiet rooms', '["#8d857a","#a49b8e","#bcb3a5","#6f685e"]'::jsonb, '/media/stone-mosaic-night.jpg', '/media/stone-mosaic-day.jpg', 20),
    ('hexagon-marble', 'feature-mosaics', 'Hexagon marble mosaic', 'Marble hexagons for the bath', '["#e8e4dd","#d9d3c9","#c6bfb2","#f2efe9"]'::jsonb, '/media/hexagon-marble-night.jpg', '/media/hexagon-marble-day.jpg', 21)
   ON CONFLICT (slug) DO NOTHING`,
  `INSERT INTO stock_levels (piece_slug)
   SELECT s FROM unnest(ARRAY[
     'plain-blue-small-seed','mixed-blue-big-seed','tiny-seed-gold',
     'silver-crystal-mosaic','plain-white-mosaic','black-mosaic',
     'green-mosaic','orange-mosaic','stone-mosaic','hexagon-marble'
   ]) AS s
   ON CONFLICT (piece_slug) DO NOTHING`,
  /* 2026-07-04 · the media bench and shop-card slots */
  `ALTER TABLE "pieces" ADD COLUMN "card_image_night" text`,
  `ALTER TABLE "pieces" ADD COLUMN "card_image_day" text`,
  `CREATE TABLE "media_assets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "url" text NOT NULL,
    "title" text NOT NULL,
    "batch" text DEFAULT '' NOT NULL,
    "sun" text DEFAULT 'single' NOT NULL,
    "role" text DEFAULT 'card' NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "piece_slug" text,
    "notes" text DEFAULT '' NOT NULL,
    "source" text DEFAULT '' NOT NULL,
    "width" integer,
    "height" integer,
    "original_path" text DEFAULT '' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "media_assets_piece_slug_pieces_slug_fk"
      FOREIGN KEY ("piece_slug") REFERENCES "pieces"("slug") ON DELETE no action ON UPDATE no action
  )`,
  `CREATE INDEX "media_assets_batch_idx" ON "media_assets" USING btree ("batch")`,
  `CREATE INDEX "media_assets_piece_idx" ON "media_assets" USING btree ("piece_slug")`,
  `CREATE INDEX "media_assets_role_idx" ON "media_assets" USING btree ("role")`,
  `CREATE INDEX "media_assets_status_idx" ON "media_assets" USING btree ("status")`,
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
                where table_name = 'enquiries' and column_name = 'session_id') as sid,
             (select 1 from settings
                where key = 'instagram' and value = 'https://instagram.com') as stale_ig,
             (select 1 from pieces where slug = 'hexagon-marble') as skus,
             (select 1 from information_schema.columns
                where table_name = 'pieces' and column_name = 'card_image_night') as card_slot,
             to_regclass('public.media_assets') as media_assets`);
    const row = rowsOf<{
      staff: string | null;
      push: string | null;
      sid: number | null;
      stale_ig: number | null;
      skus: number | null;
      card_slot: number | null;
      media_assets: string | null;
    }>(probe)[0];
    if (
      row?.staff &&
      row?.push &&
      row?.sid &&
      !row?.stale_ig &&
      row?.skus &&
      row?.card_slot &&
      row?.media_assets
    ) {
      healed = true;
      return;
    }
    for (const stmt of DDL) {
      try {
        await db.execute(sql.raw(stmt));
        console.log("[schema] applied:", stmt.replace(/\s+/g, " ").slice(0, 56));
      } catch (e) {
        /* Drizzle wraps the driver error: the true reason lives in
           the cause, so tolerance and diagnosis both read it. */
        const cause = (e as { cause?: unknown })?.cause;
        const m = `${String(e)} :: ${String(cause ?? "")}`;
        if (!/already exists|duplicate/i.test(m)) {
          console.error(
            "[schema] statement failed:",
            stmt.replace(/\s+/g, " ").slice(0, 48),
            "::",
            String(cause ?? e).slice(0, 200)
          );
        }
      }
    }
    healed = true;
    console.log("[schema] the book is current");
  } catch (e) {
    console.error("[schema] probe failed:", String(e).slice(0, 200));
  }
}
