ALTER TABLE "pieces" ADD COLUMN "unit" text DEFAULT 'sheets' NOT NULL;--> statement-breakpoint
ALTER TABLE "ranges" ADD COLUMN "family" text DEFAULT 'mosaic' NOT NULL;