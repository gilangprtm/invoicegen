CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text,
	"email" text,
	"phone" text,
	"website" text,
	"address" text,
	"tax_id" text,
	"payment_account_name" text,
	"routing_number" text,
	"issuer_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;