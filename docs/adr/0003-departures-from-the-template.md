# Three departures from the Better-T-Stack template

The template (Next.js, Hono, tRPC, Drizzle on Postgres, Better Auth, Polar, Expo) is kept except for three deliberate changes.

- **Stripe replaces Polar.** Pricing charges a card on file per title when the packet is handed over and refunds under the Dealer promise. Polar's metered billing invoices at the end of a cycle, and its documented refund path is the dashboard.
- **No native app in v1.** Intake is phone-first web with camera capture, so `apps/native` is dropped.
- **No durable-workflow product.** A Deal is a Postgres state machine with an append-only event table (the audit log the data decision already requires), and Vercel Cron finds due check-ins. Chase work is human-paced with day-scale timers, so a workflow engine would add a dependency without removing a problem.
