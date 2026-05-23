ALTER TABLE "food_catalog" ALTER COLUMN "serving_size" SET DATA TYPE numeric(7, 1);--> statement-breakpoint
ALTER TABLE "food_catalog" ALTER COLUMN "serving_size" SET DEFAULT '100';