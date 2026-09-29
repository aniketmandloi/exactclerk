import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@exactclerk/db";
import * as schema from "@exactclerk/db/schema/auth";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { emailOTP, organization } from "better-auth/plugins";

import { ac, can, dealerRoles } from "./access";
import { isDealerRole } from "./actor";
import { createPolarClient } from "./lib/payments";
import type { Mailer } from "./mailer";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SUCCESS_URL: string;
};

// Polar's checkout, customer and usage endpoints; its webhook endpoint is not a user's to call.
const BILLING_PATHS = ["/checkout", "/customer/", "/usage/"];

export function createAuth(
  env: AuthConfig,
  database: Database,
  mailer: Mailer,
  desktopOrigins: readonly string[] = [],
) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN,
      ...desktopOrigins,
      "exactclerk://",
      "exp://",
      "http://localhost:8081",
    ],
    emailAndPassword: { enabled: false },
    user: {
      additionalFields: {
        staffRole: { type: "string", required: false, input: false },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!BILLING_PATHS.some((path) => ctx.path.startsWith(path))) return;
        const session = await getSessionFromCtx(ctx);
        const member = session
          ? await database.query.member.findFirst({ where: { userId: session.user.id } })
          : undefined;
        const mayUseBilling =
          member !== undefined &&
          isDealerRole(member.role) &&
          can(
            { kind: "dealer", userId: member.userId, dealerId: member.organizationId, role: member.role },
            { billing: ["read"] },
          );
        if (!mayUseBilling) {
          throw new APIError("FORBIDDEN", { message: "Billing is for a Dealer's owner" });
        }
      }),
    },
    databaseHooks: {
      session: {
        create: {
          // A user belongs to one Dealer in v1, so every new session starts inside it.
          async before(session) {
            const membership = await database.query.member.findFirst({
              where: { userId: session.userId },
            });
            return { data: { ...session, activeOrganizationId: membership?.organizationId } };
          },
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [
      organization({
        ac,
        roles: dealerRoles,
        // A user belongs to one Dealer in v1, so nobody who already has one can start another.
        async allowUserToCreateOrganization(user) {
          const membership = await database.query.member.findFirst({ where: { userId: user.id } });
          return membership === undefined;
        },
        async sendInvitationEmail({ email, id, organization, inviter }) {
          await mailer.send({
            to: email,
            subject: `${inviter.user.name || inviter.user.email} invited you to ${organization.name} on ExactClerk`,
            text: `Accept the invitation: ${env.CORS_ORIGIN}/accept-invitation/${id}`,
          });
        },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await mailer.send({
            to: email,
            subject: "Your ExactClerk sign-in code",
            text: `Your ExactClerk sign-in code is ${otp}. It expires in 5 minutes.`,
          });
        },
      }),
      polar({
        client: createPolarClient(env),
        // The Dealer pays, not each user, so no Polar customer per sign-up; #28 decides when one is created.
        createCustomerOnSignUp: false,
        use: [
          checkout({
            products: [{ productId: "your-product-id", slug: "pro" }],
            successUrl: env.POLAR_SUCCESS_URL,
            authenticatedUsersOnly: true,
          }),
          portal(),
        ],
      }),
      expo(),
    ],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
