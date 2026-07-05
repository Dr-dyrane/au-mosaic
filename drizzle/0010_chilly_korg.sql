CREATE TABLE "sales_motions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"scheduled_for" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_motions" ADD CONSTRAINT "sales_motions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_motions_customer_idx" ON "sales_motions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_motions_status_idx" ON "sales_motions" USING btree ("status");