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
