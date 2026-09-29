import type { Actor } from "@exactclerk/auth/actor";
import { createTestDb } from "@exactclerk/db/testing";
import { organization, user } from "@exactclerk/db/schema";
import { beforeEach, describe, expect, it } from "vitest";

import { dealRepository } from "./deal-repository";

const ownerA: Actor = { kind: "dealer", userId: "user-a", dealerId: "dealer-a", role: "owner" };
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
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A" });
    await dealRepository(db, ownerB).create({ vin: "VIN-B" });

    const seen = await dealRepository(db, ownerA).list();

    expect(seen.map((d) => d.id)).toEqual([a.id]);
  });

  it("cannot read another Dealer's Deal even when it knows the id", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A" });

    expect(await dealRepository(db, ownerB).get(a.id)).toBeNull();
    expect((await dealRepository(db, ownerA).get(a.id))?.vin).toBe("VIN-A");
  });

  it("cannot change another Dealer's Deal, and leaves it untouched", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A" });

    const result = await dealRepository(db, ownerB).update(a.id, { vin: "HIJACKED" });

    expect(result).toBeNull();
    expect((await dealRepository(db, ownerA).get(a.id))?.vin).toBe("VIN-A");
  });

  it("shows a clerk only the Deals a lead clerk assigned to them", async () => {
    const assigned = await dealRepository(db, ownerA).create({ vin: "VIN-1" });
    const other = await dealRepository(db, ownerB).create({ vin: "VIN-2" });
    await dealRepository(db, leadClerk).assignClerk(assigned.id, "clerk-1");

    const seen = await dealRepository(db, clerk).list();

    expect(seen.map((d) => d.id)).toEqual([assigned.id]);
    expect(await dealRepository(db, clerk).get(other.id)).toBeNull();
  });

  it("lets a lead clerk and an admin see every Dealer's Deals", async () => {
    await dealRepository(db, ownerA).create({ vin: "VIN-1" });
    await dealRepository(db, ownerB).create({ vin: "VIN-2" });

    expect(await dealRepository(db, leadClerk).list()).toHaveLength(2);
    expect(await dealRepository(db, admin).list()).toHaveLength(2);
  });

  it("refuses actions outside the actor's role", async () => {
    const a = await dealRepository(db, ownerA).create({ vin: "VIN-A" });

    await expect(dealRepository(db, clerk).assignClerk(a.id, "clerk-1")).rejects.toThrow();
    await expect(dealRepository(db, ownerA).assignClerk(a.id, "clerk-1")).rejects.toThrow();
    await expect(dealRepository(db, clerk).create({ vin: "VIN-X" })).rejects.toThrow();
    await expect(dealRepository(db, leadClerk).update(a.id, { vin: "EDITED" })).rejects.toThrow();
  });
});
