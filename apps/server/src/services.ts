import { createAuth } from "@exactclerk/auth";
import { createDb } from "@exactclerk/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
