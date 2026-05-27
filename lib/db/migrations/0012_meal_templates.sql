CREATE TABLE "meal_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_template_meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"name" text NOT NULL,
	"time" time,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_template_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_meal_id" integer NOT NULL,
	"catalog_food_id" integer,
	"amount_g" numeric(8, 1),
	"name" text NOT NULL,
	"calories" numeric(7, 1) NOT NULL,
	"protein" numeric(6, 1) NOT NULL,
	"fat" numeric(6, 1) NOT NULL,
	"carbs" numeric(6, 1) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "meal_template_meals" ADD CONSTRAINT "meal_template_meals_template_id_meal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."meal_templates"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "meal_template_foods" ADD CONSTRAINT "meal_template_foods_template_meal_id_meal_template_meals_id_fk" FOREIGN KEY ("template_meal_id") REFERENCES "public"."meal_template_meals"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "meal_template_foods" ADD CONSTRAINT "meal_template_foods_catalog_food_id_food_catalog_id_fk" FOREIGN KEY ("catalog_food_id") REFERENCES "public"."food_catalog"("id") ON DELETE set null ON UPDATE no action;
