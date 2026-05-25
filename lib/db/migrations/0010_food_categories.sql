CREATE TABLE "food_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  CONSTRAINT "food_categories_user_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "food_catalog" ADD COLUMN "category_id" integer REFERENCES "food_categories"("id") ON DELETE set null;
