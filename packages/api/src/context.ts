import type { Session } from "@exactclerk/auth";
import type { Database } from "@exactclerk/db";

export type Context = {
  session: Session | null;
  db: Database;
};
