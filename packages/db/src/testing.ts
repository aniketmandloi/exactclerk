import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { Database } from "./index";
import { relations } from "./relations";

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

// PGlite and Neon HTTP expose the same Drizzle query API, and the code under test only uses that.
export async function createTestDb(): Promise<Database> {
  const db = drizzle({ client: new PGlite(), relations });
  await migrate(db, { migrationsFolder });
  return db as unknown as Database;
}
