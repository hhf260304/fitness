CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "food_catalog" DROP CONSTRAINT "food_catalog_name_unique";--> statement-breakpoint
ALTER TABLE "goals" DROP CONSTRAINT "goals_date_unique";--> statement-breakpoint
ALTER TABLE "food_catalog" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "food_catalog" ADD CONSTRAINT "food_catalog_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_catalog" ADD CONSTRAINT "food_catalog_user_name_unique" UNIQUE("user_id","name");--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_date_unique" UNIQUE("user_id","date");