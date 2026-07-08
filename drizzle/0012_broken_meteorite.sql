ALTER TABLE "pieces" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ranges" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
