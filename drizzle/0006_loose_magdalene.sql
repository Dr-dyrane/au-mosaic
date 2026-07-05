CREATE TABLE "media_assets" (
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pieces" ADD COLUMN "card_image_night" text;--> statement-breakpoint
ALTER TABLE "pieces" ADD COLUMN "card_image_day" text;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_piece_slug_pieces_slug_fk" FOREIGN KEY ("piece_slug") REFERENCES "public"."pieces"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_batch_idx" ON "media_assets" USING btree ("batch");--> statement-breakpoint
CREATE INDEX "media_assets_piece_idx" ON "media_assets" USING btree ("piece_slug");--> statement-breakpoint
CREATE INDEX "media_assets_role_idx" ON "media_assets" USING btree ("role");--> statement-breakpoint
CREATE INDEX "media_assets_status_idx" ON "media_assets" USING btree ("status");