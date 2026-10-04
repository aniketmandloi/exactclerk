CREATE TABLE "deal_event" (
	"id" text PRIMARY KEY,
	"deal_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"actor_role" text NOT NULL,
	"type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Deals made before kind existed were never opened through the app; call them retail sales.
ALTER TABLE "deal" ADD COLUMN "kind" text NOT NULL DEFAULT 'retail_sale';--> statement-breakpoint
ALTER TABLE "deal" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "out_of_state_title" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "salvage" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "bonded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "power_of_attorney" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "lien_present" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "approved_tier" text;--> statement-breakpoint
ALTER TABLE "deal" ADD COLUMN "approved_price_cents" integer;--> statement-breakpoint
CREATE INDEX "deal_event_dealId_idx" ON "deal_event" ("deal_id");--> statement-breakpoint
ALTER TABLE "deal_event" ADD CONSTRAINT "deal_event_deal_id_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deal"("id");--> statement-breakpoint
CREATE FUNCTION "deal_event_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	RAISE EXCEPTION 'deal_event is append-only';
END;
$$;--> statement-breakpoint
CREATE TRIGGER "deal_event_append_only" BEFORE UPDATE OR DELETE OR TRUNCATE ON "deal_event" FOR EACH STATEMENT EXECUTE FUNCTION "deal_event_append_only"();
