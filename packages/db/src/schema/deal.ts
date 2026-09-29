import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const deal = pgTable(
  "deal",
  {
    id: text("id").primaryKey(),
    dealerId: text("dealer_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    vin: text("vin").notNull(),
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
