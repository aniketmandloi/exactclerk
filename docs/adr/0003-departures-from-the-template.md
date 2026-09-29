# One departure from the Better-T-Stack template

The template (Next.js, Hono, tRPC, Drizzle on Postgres, Better Auth, Polar, Expo) is kept except for one deliberate change.

- **No durable-workflow product.** A Deal is a Postgres state machine with an append-only event table (the audit log the data decision already requires), and Vercel Cron finds due check-ins. Chase work is human-paced with day-scale timers, so a workflow engine would add a dependency without removing a problem.

## Amended: Polar and the native app are kept

This ADR first replaced Polar with Stripe and dropped `apps/native`. Both are reversed.

- **Polar stays.** Stripe is not available in India, where the business operates, so it can't be the payments provider. Whether Polar can charge a fixed per-title price at hand-over and refund under the Dealer promise is unverified: its metered billing invoices at the end of a cycle, and a refund path other than the dashboard has not been confirmed. Check this against Polar's docs before the hand-over ticket (#28) and the promise ticket (#31).
- **`apps/native` stays, untouched in v1.** Intake is phone-first web with camera capture, so v1 doesn't use it, but it is kept for the future and no v1 ticket modifies it. The Expo auth plugin stays.
