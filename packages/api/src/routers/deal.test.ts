import type { Session } from "@exactclerk/auth";
import type { Actor } from "@exactclerk/auth/actor";
import { organization } from "@exactclerk/db/schema";
import { createTestDb } from "@exactclerk/db/testing";
import { describe, expect, it } from "vitest";

import { appRouter } from "./index";

const owner: Actor = { kind: "dealer", userId: "user-a", dealerId: "dealer-a", role: "owner" };
const facts = {
  outOfStateTitle: false,
  salvage: false,
  bonded: false,
  powerOfAttorney: false,
  lienPresent: true,
};

async function callerFor(actor: Actor | null) {
  const db = await createTestDb();
  await db
    .insert(organization)
    .values({ id: "dealer-a", name: "Dealer A", slug: "dealer-a", createdAt: new Date() });
  return appRouter.createCaller({ db, actor, session: {} as Session });
}

describe("deal router", () => {
  it("opens a Deal from a VIN typed in lower case with spaces around it", async () => {
    const caller = await callerFor(owner);

    const opened = await caller.deal.open({
      vin: " 1hgcm82633a004352 ",
      kind: "retail_sale",
      ...facts,
    });

    expect(opened).toMatchObject({ vin: "1HGCM82633A004352", tier: "lien", priceCents: 7900 });
  });

  it("refuses a VIN with characters a VIN can't have", async () => {
    const caller = await callerFor(owner);

    await expect(
      caller.deal.open({ vin: "1HGCM8-2633", kind: "retail_sale", ...facts }),
    ).rejects.toThrow(/VIN/);
  });

  it("asks a signed-in user with no dealership to create or join one", async () => {
    const caller = await callerFor(null);

    await expect(caller.deal.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reports a Deal the actor can't see as not found", async () => {
    const caller = await callerFor(owner);

    await expect(caller.deal.get({ id: "someone-elses-deal" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
