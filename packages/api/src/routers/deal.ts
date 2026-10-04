import { DEAL_KINDS, PRICE_TIERS } from "@exactclerk/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { dealRepository } from "../deal-repository";
import { actorProcedure, router } from "../index";

// Pre-1981 VINs are shorter than 17 characters and don't follow the modern alphabet.
const vin = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{1,17}$/, "A VIN is up to 17 letters and digits");

const intake = z.object({
  vin,
  kind: z.enum(DEAL_KINDS),
  outOfStateTitle: z.boolean(),
  salvage: z.boolean(),
  bonded: z.boolean(),
  powerOfAttorney: z.boolean(),
  lienPresent: z.boolean(),
});

const byId = z.object({ id: z.string() });

function found<T>(deal: T | null): T {
  if (!deal) throw new TRPCError({ code: "NOT_FOUND", message: "No such Deal" });
  return deal;
}

export const dealRouter = router({
  list: actorProcedure.query(({ ctx }) => dealRepository(ctx.db, ctx.actor).list()),

  get: actorProcedure
    .input(byId)
    .query(async ({ ctx, input }) => found(await dealRepository(ctx.db, ctx.actor).get(input.id))),

  open: actorProcedure
    .input(intake)
    .mutation(({ ctx, input }) => dealRepository(ctx.db, ctx.actor).create(input)),

  updateIntake: actorProcedure
    .input(intake.partial().extend(byId.shape))
    .mutation(async ({ ctx, input: { id, ...changes } }) =>
      found(await dealRepository(ctx.db, ctx.actor).update(id, changes)),
    ),

  approvePrice: actorProcedure
    .input(byId.extend({ tier: z.enum(PRICE_TIERS) }))
    .mutation(async ({ ctx, input }) =>
      found(await dealRepository(ctx.db, ctx.actor).approvePrice(input.id, input.tier)),
    ),

  start: actorProcedure
    .input(byId)
    .mutation(async ({ ctx, input }) =>
      found(await dealRepository(ctx.db, ctx.actor).start(input.id)),
    ),
});
