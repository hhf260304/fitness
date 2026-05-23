ALTER TABLE "food_catalog" ADD COLUMN "serving_size" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_foods" ADD COLUMN "catalog_food_id" integer;--> statement-breakpoint
ALTER TABLE "meal_foods" ADD COLUMN "amount_g" numeric(8, 1);--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_catalog_food_id_food_catalog_id_fk" FOREIGN KEY ("catalog_food_id") REFERENCES "public"."food_catalog"("id") ON DELETE set null ON UPDATE no action;