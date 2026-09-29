import type { Session } from "@exactclerk/auth";
import type { Actor } from "@exactclerk/auth/actor";
import type { Database } from "@exactclerk/db";

export type Context = {
  session: Session | null;
  actor: Actor | null;
  db: Database;
};
