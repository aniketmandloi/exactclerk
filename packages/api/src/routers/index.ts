import { protectedProcedure, publicProcedure, router } from "../index";
import { dealRouter } from "./deal";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  deal: dealRouter,
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
