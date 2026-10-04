import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const DEAL_KINDS = ["retail_sale", "trade_in"] as const;
export type DealKind = (typeof DEAL_KINDS)[number];

export const DEAL_STATUSES = [
  "draft",
  "waiting_on_you",
  "ready_for_clerk_review",
  "ready_to_submit",
  "submitted",
  "rejected",
  "cleared",
] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const PRICE_TIERS = ["standard", "lien", "complex"] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

export const DEAL_EVENT_TYPES = [
  "opened",
  "intake_updated",
  "price_approved",
  "status_changed",
] as const;
export type DealEventType = (typeof DEAL_EVENT_TYPES)[number];

export const deal = pgTable(
  "deal",
  {
    id: text("id").primaryKey(),
    dealerId: text("dealer_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    vin: text("vin").notNull(),
    kind: text("kind", { enum: DEAL_KINDS }).notNull(),
    status: text("status", { enum: DEAL_STATUSES }).default("draft").notNull(),
    outOfStateTitle: boolean("out_of_state_title").default(false).notNull(),
    salvage: boolean("salvage").default(false).notNull(),
    bonded: boolean("bonded").default(false).notNull(),
    powerOfAttorney: boolean("power_of_attorney").default(false).notNull(),
    lienPresent: boolean("lien_present").default(false).notNull(),
    approvedTier: text("approved_tier", { enum: PRICE_TIERS }),
    approvedPriceCents: integer("approved_price_cents"),
    assignedClerkId: text("assigned_clerk_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("deal_dealerId_idx").on(table.dealerId),
    index("deal_assignedClerkId_idx").on(table.assignedClerkId),
  ],
);

// Append-only: a trigger in the migration refuses UPDATE and DELETE. It is the audit log, so it
// holds no images or raw ID values, and actors are kept as plain ids so a deleted user leaves it intact.
export const dealEvent = pgTable(
  "deal_event",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id),
    actorUserId: text("actor_user_id").notNull(),
    actorRole: text("actor_role").notNull(),
    type: text("type", { enum: DEAL_EVENT_TYPES }).notNull(),
    fromStatus: text("from_status", { enum: DEAL_STATUSES }),
    toStatus: text("to_status", { enum: DEAL_STATUSES }),
    data: jsonb("data").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("deal_event_dealId_idx").on(table.dealId)],
);
