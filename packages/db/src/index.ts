import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dataDir, monorepoRoot } from "@foundry/env";
import * as schema from "./schema";

export * from "./schema";
export { and, asc, count, desc, eq, inArray, isNull, like, max, ne, or, sql } from "drizzle-orm";

export type DB = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __foundryDb?: DB };

export function migrationsFolder(): string {
  return path.join(monorepoRoot(), "packages", "db", "drizzle");
}

function createDb(): DB {
  const sqlite = new Database(path.join(dataDir(), "foundry.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  // Migrations are idempotent, so applying them on first connection keeps
  // local setup to a single `pnpm dev`.
  migrate(db, { migrationsFolder: migrationsFolder() });
  return db;
}

/** Lazily-created singleton (survives Next.js hot reloads in dev). */
export function getDb(): DB {
  globalForDb.__foundryDb ??= createDb();
  return globalForDb.__foundryDb;
}
