# One departure from the Better-T-Stack template

The template (Next.js, Hono, tRPC, Drizzle on Postgres, Better Auth, Polar, Expo) is kept except for one deliberate change.

- **No durable-workflow product.** A Deal is a Postgres state machine with an append-only event table (the audit log the data decision already requires), and Vercel Cron finds due check-ins. Chase work is human-paced with day-scale timers, so a workflow engine would add a dependency without removing a problem.

## Amended: Polar and the native app are kept

This ADR first replaced Polar with Stripe and dropped `apps/native`. Both are reversed.

- **Polar stays.** Stripe is not available in India, where the business operates, so it can't be the payments provider. Whether Polar can charge a fixed per-title price at hand-over and refund under the Dealer promise is unverified: its metered billing invoices at the end of a cycle, and a refund path other than the dashboard has not been confirmed. Check this against Polar's docs before the hand-over ticket (#28) and the promise ticket (#31).

  Checked 2026-09-29 against Polar's docs:
  - **Polar may not accept ExactClerk at all.** Its [acceptable use policy](https://polar.sh/docs/merchant-of-record/acceptable-use) says Polar serves software companies, that a company whose primary offering is human services should not use it, and lists "Human services" and "Government Services" among prohibited products. ExactClerk is software with a clerk gating every hand-over, filing with a state agency. Get Polar's written answer before building #28; if it is no, the provider is reopened.
  - **Refunds have an API**: `POST /v1/refunds/` takes an order, a reason and an amount, and allows partial refunds, so #31's refund is possible.
  - **Metered prices only exist on subscription products**, so a per-title charge is either a usage event on a subscription, invoiced at the end of each cycle, or a one-time checkout per Deal. Neither is a card charged at hand-over; #28 picks one.
- **`apps/native` stays, untouched in v1.** Intake is phone-first web with camera capture, so v1 doesn't use it, but it is kept for the future and no v1 ticket modifies it. The Expo auth plugin stays.
