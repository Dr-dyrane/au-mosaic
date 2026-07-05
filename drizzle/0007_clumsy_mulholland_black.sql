ALTER TABLE "order_items" ADD COLUMN "return_for_item_id" uuid;--> statement-breakpoint
CREATE INDEX "order_items_return_for_idx" ON "order_items" USING btree ("return_for_item_id");