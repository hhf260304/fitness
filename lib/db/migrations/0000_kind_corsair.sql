CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"muscle" text NOT NULL,
	"sets" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight" numeric(6, 2) NOT NULL,
	"rest" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" numeric(6, 1) NOT NULL,
	"fat" numeric(6, 1) NOT NULL,
	"carbs" numeric(6, 1) NOT NULL,
	"sugar" numeric(6, 1) NOT NULL,
	CONSTRAINT "food_catalog_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer NOT NULL,
	"fat" integer NOT NULL,
	"carbs" integer NOT NULL,
	"sugar" integer NOT NULL,
	CONSTRAINT "goals_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "meal_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"name" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" numeric(6, 1) NOT NULL,
	"fat" numeric(6, 1) NOT NULL,
	"carbs" numeric(6, 1) NOT NULL,
	"sugar" numeric(6, 1) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;