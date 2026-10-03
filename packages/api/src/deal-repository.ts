import type { Actor } from "@exactclerk/auth/actor";
import type { Database } from "@exactclerk/db";
import {
  type DealEventType,
  type DealKind,
  type DealStatus,
  deal,
  dealEvent,
  type PriceTier,
} from "@exactclerk/db/schema";
import { and, asc, desc, eq, type SQL, sql } from "drizzle-orm";
import type { WithSubqueryWithSelection } from "drizzle-orm/pg-core";

import { assertCanMove, type IntakeFacts, priceTier, TIER_PRICE_CENTS } from "./deal-lifecycle";

type DealerActor = Extract<Actor, { kind: "dealer" }>;

export type Intake = { vin: string; kind: DealKind } & IntakeFacts;

type DealEventInput = {
  type: DealEventType;
  fromStatus?: DealStatus;
  toStatus?: DealStatus;
  data?: Record<string, unknown>;
};

type ChangedDeal = WithSubqueryWithSelection<{ id: typeof deal.id }, "changed">;

function requireDealer(actor: Actor): DealerActor {
  if (actor.kind !== "dealer") throw new Error("Only a Dealer can do this");
  return actor;
}

function visibleTo(actor: Actor): SQL | undefined {
  if (actor.kind === "dealer") return eq(deal.dealerId, actor.dealerId);
  if (actor.role === "clerk") return eq(deal.assignedClerkId, actor.userId);
  return undefined;
}

function priced(row: typeof deal.$inferSelect) {
  const tier = priceTier(row);
  return { ...row, tier, priceCents: TIER_PRICE_CENTS[tier] };
}

const noFacts: IntakeFacts = {
  outOfStateTitle: false,
  salvage: false,
  bonded: false,
  powerOfAttorney: false,
  lienPresent: false,
};

export function dealRepository(db: Database, actor: Actor) {
  // Neon over HTTP has no interactive transactions, so a change to a Deal and its event are
  // written as one statement: the change is a CTE and the event is inserted from its rows.
  async function recordChange(changed: ChangedDeal, event: DealEventInput) {
    const [recorded] = await db
      .with(changed)
      .insert(dealEvent)
      .select(
        db
          .select({
            id: sql`${crypto.randomUUID()}`.as("id"),
            dealId: changed.id,
            actorUserId: sql`${actor.userId}`.as("actor_user_id"),
            actorRole: sql`${actor.role}`.as("actor_role"),
            type: sql`${event.type}`.as("type"),
            fromStatus: sql`${event.fromStatus ?? null}`.as("from_status"),
            toStatus: sql`${event.toStatus ?? null}`.as("to_status"),
            data: sql`${event.data ? JSON.stringify(event.data) : null}::jsonb`.as("data"),
            createdAt: sql`now()`.as("created_at"),
          })
          .from(changed),
      )
      .returning({ dealId: dealEvent.dealId });
    if (!recorded) throw new Error("The Deal changed meanwhile; try again");
  }

  function changeDraft(id: string, changes: Partial<typeof deal.$inferInsert>) {
    return db.$with("changed").as(
      db
        .update(deal)
        .set(changes)
        .where(and(eq(deal.id, id), visibleTo(actor), eq(deal.status, "draft")))
        .returning({ id: deal.id }),
    );
  }

  async function get(id: string) {
    const [found] = await db
      .select()
      .from(deal)
      .where(and(eq(deal.id, id), visibleTo(actor)));
    return found ? priced(found) : null;
  }

  async function getDraft(id: string) {
    const found = await get(id);
    if (found && found.status !== "draft") {
      throw new Error("Only a Draft's intake and price can change");
    }
    return found;
  }

  async function moveTo(id: string, to: DealStatus) {
    const current = await get(id);
    if (!current) return null;
    assertCanMove(current, to);
    await recordChange(
      db.$with("changed").as(
        db
          .update(deal)
          .set({ status: to })
          .where(and(eq(deal.id, id), visibleTo(actor), eq(deal.status, current.status)))
          .returning({ id: deal.id }),
      ),
      { type: "status_changed", fromStatus: current.status, toStatus: to },
    );
    return get(id);
  }

  return {
    async create(input: { vin: string; kind: DealKind } & Partial<IntakeFacts>) {
      const { dealerId } = requireDealer(actor);
      const id = crypto.randomUUID();
      const intake: Intake = { ...noFacts, ...input };
      await recordChange(
        db.$with("changed").as(
          db
            .insert(deal)
            .values({ id, dealerId, ...intake })
            .returning({ id: deal.id }),
        ),
        { type: "opened", toStatus: "draft", data: { ...intake, tier: priceTier(intake) } },
      );
      const created = await get(id);
      if (!created) throw new Error("The Deal was not created");
      return created;
    },

    async list() {
      const rows = await db
        .select()
        .from(deal)
        .where(visibleTo(actor))
        .orderBy(desc(deal.createdAt));
      return rows.map(priced);
    },

    get,

    async update(id: string, changes: Partial<Intake>) {
      requireDealer(actor);
      const current = await getDraft(id);
      if (!current) return null;
      const tier = priceTier({ ...current, ...changes });
      const approvalCleared = current.approvedTier !== null && current.approvedTier !== tier;
      await recordChange(
        changeDraft(
          id,
          approvalCleared ? { ...changes, approvedTier: null, approvedPriceCents: null } : changes,
        ),
        { type: "intake_updated", data: { ...changes, tier, approvalCleared } },
      );
      return get(id);
    },

    async approvePrice(id: string, tier: PriceTier) {
      requireDealer(actor);
      const current = await getDraft(id);
      if (!current) return null;
      if (current.tier !== tier) {
        throw new Error(`This Deal is priced ${current.tier} now, not ${tier}`);
      }
      const priceCents = TIER_PRICE_CENTS[tier];
      await recordChange(changeDraft(id, { approvedTier: tier, approvedPriceCents: priceCents }), {
        type: "price_approved",
        data: { tier, priceCents },
      });
      return get(id);
    },

    async start(id: string) {
      requireDealer(actor);
      return moveTo(id, "waiting_on_you");
    },

    async events(id: string) {
      if (!(await get(id))) return [];
      return db
        .select()
        .from(dealEvent)
        .where(eq(dealEvent.dealId, id))
        .orderBy(asc(dealEvent.createdAt));
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
