CREATE TABLE "food_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "name" text NOT NULL,
  CONSTRAINT "food_categories_user_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "food_catalog" ADD COLUMN "category_id" integer;
--> statement-breakpoint
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "food_catalog" ADD CONSTRAINT "food_catalog_category_id_food_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE set null ON UPDATE no action;
