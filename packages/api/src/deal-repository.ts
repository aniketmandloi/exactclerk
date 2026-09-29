import type { Actor } from "@exactclerk/auth/actor";
import type { Database } from "@exactclerk/db";
import { deal } from "@exactclerk/db/schema";
import { and, eq, type SQL } from "drizzle-orm";

type DealerActor = Extract<Actor, { kind: "dealer" }>;

function requireDealer(actor: Actor): DealerActor {
  if (actor.kind !== "dealer") throw new Error("Only a Dealer can do this");
  return actor;
}

function visibleTo(actor: Actor): SQL | undefined {
  if (actor.kind === "dealer") return eq(deal.dealerId, actor.dealerId);
  if (actor.role === "clerk") return eq(deal.assignedClerkId, actor.userId);
  return undefined;
}

export function dealRepository(db: Database, actor: Actor) {
  return {
    async create(input: { vin: string }) {
      const { dealerId } = requireDealer(actor);
      const [created] = await db
        .insert(deal)
        .values({ id: crypto.randomUUID(), dealerId, vin: input.vin })
        .returning();
      return created!;
    },

    list() {
      return db.select().from(deal).where(visibleTo(actor));
    },

    async get(id: string) {
      const [found] = await db
        .select()
        .from(deal)
        .where(and(eq(deal.id, id), visibleTo(actor)));
      return found ?? null;
    },

    async update(id: string, changes: { vin: string }) {
      requireDealer(actor);
      const [updated] = await db
        .update(deal)
        .set(changes)
        .where(and(eq(deal.id, id), visibleTo(actor)))
        .returning();
      return updated ?? null;
    },

    async assignClerk(id: string, clerkId: string) {
      if (actor.kind !== "exactclerk" || actor.role === "clerk") {
        throw new Error("Only a lead clerk or admin assigns a Deal");
      }
      const [updated] = await db
        .update(deal)
        .set({ assignedClerkId: clerkId })
        .where(eq(deal.id, id))
        .returning();
      return updated ?? null;
    },
  };
}
