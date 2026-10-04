import type { Actor } from "@exactclerk/auth/actor";
import { dealEvent, organization, user } from "@exactclerk/db/schema";
import { createTestDb } from "@exactclerk/db/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { dealRepository } from "./deal-repository";

const ownerA: Actor = { kind: "dealer", userId: "user-a", dealerId: "dealer-a", role: "owner" };
const staffB: Actor = { kind: "dealer", userId: "user-b2", dealerId: "dealer-b", role: "staff" };
const clerk: Actor = { kind: "exactclerk", userId: "clerk-1", role: "clerk" };
const leadClerk: Actor = { kind: "exactclerk", userId: "lead-1", role: "lead_clerk" };
const admin: Actor = { kind: "exactclerk", userId: "admin-1", role: "admin" };
const ownerB: Actor = { kind: "dealer", userId: "user-b", dealerId: "dealer-b", role: "owner" };

async function seed() {
  const db = await createTestDb();
  await db.insert(user).values([
    { id: "user-a", name: "A", email: "a@example.com" },
    { id: "user-b", name: "B", email: "b@example.com" },
    { id: "clerk-1", name: "Clerk", email: "clerk@exactclerk.test" },
    { id: "lead-1", name: "Lead", email: "lead@exactclerk.test" },
  ]);
  await db.insert(organization).values([
    { id: "dealer-a", name: "Dealer A", slug: "dealer-a", createdAt: new Date() },
    { id: "dealer-b", name: "Dealer B", slug: "dealer-b", createdAt: new Date() },
  ]);
  return db;
}

describe("dealRepository", () => {
  let db: Awaited<ReturnType<typeof seed>>;

  beforeEach(async () => {
    db = await seed();
  });

  it("lists only the Deals of the actor's own Dealer", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });
    await dealRepository(db, ownerB).create({ vin: "VIN-B", kind: "retail_sale" });

    const seen = await dealRepository(db, ownerA).list();

    expect(seen.map((d) => d.id)).toEqual([a.id]);
  });

  it("cannot read another Dealer's Deal even when it knows the id", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });

    expect(await dealRepository(db, ownerB).get(a.id)).toBeNull();
    expect((await dealRepository(db, ownerA).get(a.id))?.vin).toBe("VIN-A");
  });

  it("cannot change another Dealer's Deal, and leaves it untouched", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });

    const result = await dealRepository(db, ownerB).update(a.id, { vin: "HIJACKED" });

    expect(result).toBeNull();
    expect((await dealRepository(db, ownerA).get(a.id))?.vin).toBe("VIN-A");
  });

  it("shows a clerk only the Deals a lead clerk assigned to them", async () => {
    const assigned = await dealRepository(db, ownerA).create({ vin: "VIN-1", kind: "retail_sale" });
    const other = await dealRepository(db, ownerB).create({ vin: "VIN-2", kind: "retail_sale" });
    await dealRepository(db, leadClerk).assignClerk(assigned.id, "clerk-1");

    const seen = await dealRepository(db, clerk).list();

    expect(seen.map((d) => d.id)).toEqual([assigned.id]);
    expect(await dealRepository(db, clerk).get(other.id)).toBeNull();
  });

  it("lets a lead clerk and an admin see every Dealer's Deals", async () => {
    await dealRepository(db, ownerA).create({ vin: "VIN-1", kind: "retail_sale" });
    await dealRepository(db, ownerB).create({ vin: "VIN-2", kind: "retail_sale" });

    expect(await dealRepository(db, leadClerk).list()).toHaveLength(2);
    expect(await dealRepository(db, admin).list()).toHaveLength(2);
  });

  it("refuses actions outside the actor's role", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });

    await expect(dealRepository(db, clerk).assignClerk(a.id, "clerk-1")).rejects.toThrow();
    await expect(dealRepository(db, ownerA).assignClerk(a.id, "clerk-1")).rejects.toThrow();
    await expect(
      dealRepository(db, clerk).create({ vin: "VIN-X", kind: "retail_sale" }),
    ).rejects.toThrow();
    await expect(dealRepository(db, leadClerk).update(a.id, { vin: "EDITED" })).rejects.toThrow();
  });

  it("keeps a Dealer's staff out of another Dealer's Deals as well", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });
    const repo = dealRepository(db, staffB);

    expect(await repo.list()).toEqual([]);
    expect(await repo.get(a.id)).toBeNull();
    expect(await repo.update(a.id, { vin: "HIJACKED" })).toBeNull();
    expect((await repo.create({ vin: "VIN-B", kind: "retail_sale" })).dealerId).toBe("dealer-b");
  });
});

describe("opening a Deal", () => {
  let db: Awaited<ReturnType<typeof seed>>;

  beforeEach(async () => {
    db = await seed();
  });

  it("opens a Deal in Draft and records who opened it", async () => {
    const opened = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "trade_in" });

    expect(opened).toMatchObject({ vin: "VIN-A", kind: "trade_in", status: "draft" });
    expect(await dealRepository(db, ownerA).events(opened.id)).toMatchObject([
      { type: "opened", actorUserId: "user-a", actorRole: "owner", toStatus: "draft" },
    ]);
  });

  it("lists the newest Deal first, so a Draft is easy to return to", async () => {
    const repo = dealRepository(db, ownerA);
    const older = await repo.create({ vin: "VIN-1", kind: "retail_sale" });
    const newer = await repo.create({ vin: "VIN-2", kind: "trade_in" });

    expect((await repo.list()).map((d) => d.id)).toEqual([newer.id, older.id]);
  });

  it.each([
    [{}, "standard", 4900],
    [{ lienPresent: true }, "lien", 7900],
    [{ outOfStateTitle: true }, "complex", 9900],
    [{ salvage: true }, "complex", 9900],
    [{ bonded: true }, "complex", 9900],
    [{ powerOfAttorney: true }, "complex", 9900],
    [{ lienPresent: true, salvage: true }, "complex", 9900],
  ])("prices a Deal with intake facts %o as %s", async (facts, tier, priceCents) => {
    const opened = await dealRepository(db, ownerA).create({
      vin: "VIN-A",
      kind: "retail_sale",
      ...facts,
    });

    expect(opened).toMatchObject({ tier, priceCents });
  });

  it("returns to a Draft, changes its intake and re-prices it", async () => {
    const repo = dealRepository(db, staffB);
    const opened = await repo.create({ vin: "VIN-B", kind: "retail_sale" });

    await repo.update(opened.id, { lienPresent: true });

    expect(await repo.get(opened.id)).toMatchObject({
      status: "draft",
      lienPresent: true,
      tier: "lien",
      priceCents: 7900,
    });
    expect(await repo.events(opened.id)).toMatchObject([
      { type: "opened" },
      { type: "intake_updated", actorUserId: "user-b2", actorRole: "staff" },
    ]);
  });

  it("will not let the Deal move on until the Dealer approves its price", async () => {
    const repo = dealRepository(db, ownerA);
    const opened = await repo.create({ vin: "VIN-A", kind: "retail_sale", lienPresent: true });

    await expect(repo.start(opened.id)).rejects.toThrow(/approve/i);

    expect(await repo.approvePrice(opened.id, "lien")).toMatchObject({
      approvedTier: "lien",
      approvedPriceCents: 7900,
    });
    expect(await repo.start(opened.id)).toMatchObject({ status: "waiting_on_you" });
    expect(await repo.events(opened.id)).toMatchObject([
      { type: "opened" },
      { type: "price_approved", data: { tier: "lien", priceCents: 7900 } },
      { type: "status_changed", fromStatus: "draft", toStatus: "waiting_on_you" },
    ]);
  });

  it("refuses an approval for a price the Deal is no longer at", async () => {
    const repo = dealRepository(db, ownerA);
    const opened = await repo.create({ vin: "VIN-A", kind: "retail_sale", bonded: true });

    await expect(repo.approvePrice(opened.id, "standard")).rejects.toThrow();
    expect((await repo.get(opened.id))?.approvedTier).toBeNull();
  });

  it("asks for approval again when an intake change moves the Deal to another tier", async () => {
    const repo = dealRepository(db, ownerA);
    const opened = await repo.create({ vin: "VIN-A", kind: "retail_sale" });
    await repo.approvePrice(opened.id, "standard");

    await repo.update(opened.id, { vin: "VIN-A2" });
    expect((await repo.get(opened.id))?.approvedTier).toBe("standard");

    await repo.update(opened.id, { lienPresent: true });
    expect((await repo.get(opened.id))?.approvedTier).toBeNull();
    await expect(repo.start(opened.id)).rejects.toThrow(/approve/i);
  });

  // The test database runs queries in the order they're sent, so each pair below reads the
  // Deal before either one writes.
  it("won't start a Deal whose tier another user changed after it was read", async () => {
    const owner = dealRepository(db, ownerA);
    const opened = await owner.create({ vin: "VIN-A", kind: "retail_sale" });
    await owner.approvePrice(opened.id, "standard");
    const staff = dealRepository(db, { ...ownerA, userId: "user-a2", role: "staff" });

    const [, started] = await Promise.allSettled([
      staff.update(opened.id, { lienPresent: true }),
      owner.start(opened.id),
    ]);

    expect(started.status).toBe("rejected");
    expect(await owner.get(opened.id)).toMatchObject({
      status: "draft",
      tier: "lien",
      approvedTier: null,
    });
  });

  it("won't approve a price another user changed after it was read", async () => {
    const owner = dealRepository(db, ownerA);
    const opened = await owner.create({ vin: "VIN-A", kind: "retail_sale" });
    const staff = dealRepository(db, { ...ownerA, userId: "user-a2", role: "staff" });

    const [, approved] = await Promise.allSettled([
      staff.update(opened.id, { lienPresent: true }),
      owner.approvePrice(opened.id, "standard"),
    ]);

    expect(approved.status).toBe("rejected");
    expect(await owner.get(opened.id)).toMatchObject({ tier: "lien", approvedTier: null });
  });

  it("keeps the intake and price fixed once the Deal has left Draft", async () => {
    const repo = dealRepository(db, ownerA);
    const opened = await repo.create({ vin: "VIN-A", kind: "retail_sale" });
    await repo.approvePrice(opened.id, "standard");
    await repo.start(opened.id);

    await expect(repo.update(opened.id, { lienPresent: true })).rejects.toThrow(/draft/i);
    await expect(repo.approvePrice(opened.id, "standard")).rejects.toThrow(/draft/i);
    await expect(repo.start(opened.id)).rejects.toThrow();
    expect(await repo.get(opened.id)).toMatchObject({ status: "waiting_on_you", tier: "standard" });
  });

  it("keeps another Dealer and ExactClerk staff from approving, starting or reading its history", async () => {
    const opened = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });

    expect(await dealRepository(db, ownerB).approvePrice(opened.id, "standard")).toBeNull();
    expect(await dealRepository(db, ownerB).start(opened.id)).toBeNull();
    expect(await dealRepository(db, ownerB).events(opened.id)).toEqual([]);
    await expect(
      dealRepository(db, leadClerk).approvePrice(opened.id, "standard"),
    ).rejects.toThrow();
    await expect(dealRepository(db, leadClerk).start(opened.id)).rejects.toThrow();
    expect((await dealRepository(db, ownerA).get(opened.id))?.approvedTier).toBeNull();
  });

  it("never lets the event log be rewritten", async () => {
    const opened = await dealRepository(db, ownerA).create({ vin: "VIN-A", kind: "retail_sale" });
    const appendOnly = { cause: { message: expect.stringMatching(/append-only/) } };

    await expect(db.update(dealEvent).set({ actorUserId: "someone-else" })).rejects.toMatchObject(
      appendOnly,
    );
    await expect(db.delete(dealEvent)).rejects.toMatchObject(appendOnly);
    expect(await dealRepository(db, ownerA).events(opened.id)).toHaveLength(1);
  });
});
