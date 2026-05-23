ALTER TABLE "meal_foods"
  ADD COLUMN IF NOT EXISTS "catalog_food_id" integer REFERENCES "food_catalog"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "amount_g" numeric(8,1);
