ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sales_motions" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enquiries" DROP CONSTRAINT IF EXISTS "enquiries_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "enquiries" DROP CONSTRAINT IF EXISTS "enquiries_piece_slug_pieces_slug_fk";
--> statement-breakpoint
ALTER TABLE "media_assets" DROP CONSTRAINT IF EXISTS "media_assets_piece_slug_pieces_slug_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "sales_motions" DROP CONSTRAINT IF EXISTS "sales_motions_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_piece_slug_pieces_slug_fk" FOREIGN KEY ("piece_slug") REFERENCES "public"."pieces"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_piece_slug_pieces_slug_fk" FOREIGN KEY ("piece_slug") REFERENCES "public"."pieces"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_motions" ADD CONSTRAINT "sales_motions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;