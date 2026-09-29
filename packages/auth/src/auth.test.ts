import { createTestDb } from "@exactclerk/db/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { createAuth } from "./index";
import type { Mail, Mailer } from "./mailer";

const env = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
  CORS_ORIGIN: "http://localhost:3001",
  POLAR_ACCESS_TOKEN: "unused",
  POLAR_SUCCESS_URL: "http://localhost:3001/success",
};

function setup() {
  return createTestDb().then((db) => {
    const outbox: Mail[] = [];
    const mailer: Mailer = { send: async (mail) => void outbox.push(mail) };
    return { auth: createAuth(env, db, mailer), outbox };
  });
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
    const code = outbox[0]?.text.match(/\b\d{6}\b/)?.[0];
    expect(code).toBeDefined();

    const { headers } = await auth.api.signInEmailOTP({
      body: { email: "owner@dealer.test", otp: code! },
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
