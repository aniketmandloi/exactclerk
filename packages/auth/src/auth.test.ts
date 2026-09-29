import { user } from "@exactclerk/db/schema";
import { createTestDb } from "@exactclerk/db/testing";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { getActor } from "./get-actor";
import { createAuth } from "./index";
import type { Mail, Mailer } from "./mailer";

const env = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
  CORS_ORIGIN: "http://localhost:3001",
  POLAR_ACCESS_TOKEN: "unused",
  POLAR_SUCCESS_URL: "http://localhost:3001/success",
};

async function setup() {
  const db = await createTestDb();
  const outbox: Mail[] = [];
  const mailer: Mailer = { send: async (mail) => void outbox.push(mail) };
  const auth = createAuth(env, db, mailer);

  async function signIn(email: string) {
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    const code = outbox.findLast((mail) => mail.to === email)?.text.match(/\b\d{6}\b/)?.[0];
    if (!code) throw new Error(`no sign-in code was emailed to ${email}`);
    const { headers } = await auth.api.signInEmailOTP({
      body: { email, otp: code },
      returnHeaders: true,
    });
    return new Headers({ cookie: headers.getSetCookie().join("; ") });
  }

  async function createDealership(owner: Headers) {
    const dealership = await auth.api.createOrganization({
      body: { name: "Lone Star Autos", slug: "lone-star-autos" },
      headers: owner,
    });
    if (!dealership) throw new Error("the dealership was not created");
    return dealership;
  }

  return { auth, db, outbox, signIn, createDealership };
}

describe("email one-time-code sign-in", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  it("signs a Dealer owner in with the code emailed to them", async () => {
    const { auth, outbox } = ctx;

    await auth.api.sendVerificationOTP({ body: { email: "owner@dealer.test", type: "sign-in" } });

    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.to).toBe("owner@dealer.test");
    const code = outbox[0]?.text.match(/\b\d{6}\b/)?.[0] ?? "";
    expect(code).toMatch(/^\d{6}$/);

    const { headers } = await auth.api.signInEmailOTP({
      body: { email: "owner@dealer.test", otp: code },
      returnHeaders: true,
    });
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: headers.getSetCookie().join("; ") }),
    });
    expect(session?.user.email).toBe("owner@dealer.test");
  });

  it("has no email and password sign-in or sign-up", async () => {
    const { auth } = ctx;

    await expect(
      auth.api.signUpEmail({
        body: { email: "owner@dealer.test", password: "correct horse battery", name: "Owner" },
      }),
    ).rejects.toThrow();
    await expect(
      auth.api.signInEmail({ body: { email: "owner@dealer.test", password: "correct horse battery" } }),
    ).rejects.toThrow();
  });
});

describe("Dealer accounts", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  async function openDealership() {
    const owner = await ctx.signIn("owner@dealer.test");
    const dealership = await ctx.createDealership(owner);
    return { owner, dealership };
  }

  it("lets the owner invite staff, who join the same dealership with the staff role", async () => {
    const { owner, dealership } = await openDealership();

    const invitation = await ctx.auth.api.createInvitation({
      body: { email: "sam@dealer.test", role: "staff", organizationId: dealership.id },
      headers: owner,
    });
    expect(ctx.outbox.at(-1)?.to).toBe("sam@dealer.test");

    const staff = await ctx.signIn("sam@dealer.test");
    await ctx.auth.api.acceptInvitation({ body: { invitationId: invitation.id }, headers: staff });
    const member = await ctx.auth.api.getActiveMember({ headers: staff });

    expect(member?.organizationId).toBe(dealership.id);
    expect(member?.role).toBe("staff");
  });

  it("does not let staff invite anyone", async () => {
    const { owner, dealership } = await openDealership();
    const invitation = await ctx.auth.api.createInvitation({
      body: { email: "sam@dealer.test", role: "staff", organizationId: dealership.id },
      headers: owner,
    });
    const staff = await ctx.signIn("sam@dealer.test");
    await ctx.auth.api.acceptInvitation({ body: { invitationId: invitation.id }, headers: staff });

    await expect(
      ctx.auth.api.createInvitation({
        body: { email: "other@dealer.test", role: "staff", organizationId: dealership.id },
        headers: staff,
      }),
    ).rejects.toThrow();
  });
});

describe("who is acting", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  async function dealershipWithStaff() {
    const owner = await ctx.signIn("owner@dealer.test");
    const dealership = await ctx.createDealership(owner);
    const invitation = await ctx.auth.api.createInvitation({
      body: { email: "sam@dealer.test", role: "staff", organizationId: dealership.id },
      headers: owner,
    });
    const firstStaffSession = await ctx.signIn("sam@dealer.test");
    await ctx.auth.api.acceptInvitation({
      body: { invitationId: invitation.id },
      headers: firstStaffSession,
    });
    return { owner, dealerId: dealership.id };
  }

  it("knows nobody who is not signed in", async () => {
    expect(await getActor(ctx.auth, new Headers())).toBeNull();
  });

  it("knows an owner and their staff as members of their Dealer, including on a later sign-in", async () => {
    const { owner, dealerId } = await dealershipWithStaff();
    const staffLater = await ctx.signIn("sam@dealer.test");

    expect(await getActor(ctx.auth, owner)).toMatchObject({ kind: "dealer", dealerId, role: "owner" });
    expect(await getActor(ctx.auth, staffLater)).toMatchObject({ kind: "dealer", dealerId, role: "staff" });
  });

  it("knows ExactClerk staff by their staff role, apart from any Dealer", async () => {
    const clerk = await ctx.signIn("clerk@exactclerk.test");
    await ctx.db.update(user).set({ staffRole: "lead_clerk" }).where(eq(user.email, "clerk@exactclerk.test"));
    const freshSession = await ctx.signIn("clerk@exactclerk.test");

    expect(await getActor(ctx.auth, freshSession)).toMatchObject({ kind: "exactclerk", role: "lead_clerk" });
    expect(clerk).toBeDefined();
  });

  it("gives no actor to a signed-in user who has no Dealer and no staff role", async () => {
    const stranger = await ctx.signIn("stranger@example.com");

    expect(await getActor(ctx.auth, stranger)).toBeNull();
  });
});
