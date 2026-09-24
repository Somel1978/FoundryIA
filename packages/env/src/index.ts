import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

let cachedRoot: string | undefined;

/**
 * Walks up from the current working directory until it finds the
 * monorepo root (the folder holding pnpm-workspace.yaml). Every app and
 * package resolves shared paths from here so they agree on where data lives,
 * no matter which workspace a script is started from.
 */
export function monorepoRoot(): string {
  if (cachedRoot) return cachedRoot;
  let dir = /* turbopackIgnore: true */ process.cwd();
  while (true) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      cachedRoot = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      cachedRoot = /* turbopackIgnore: true */ process.cwd();
      return cachedRoot;
    }
    dir = parent;
  }
}

/** Root directory for all runtime data (database, snapshots, releases). */
export function dataDir(): string {
  const dir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(monorepoRoot(), "data");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Loads .env files from the monorepo root into process.env (Next.js itself
 * only reads the ones in apps/web). Existing variables always win, so real
 * environment variables and apps/web/.env* take precedence. Unlike Next.js,
 * values are taken literally: no `$VAR` expansion, so passwords may contain `$`.
 * Returns the files that were read.
 */
export function loadRootEnv(): string[] {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const files = [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"];
  const loaded: string[] = [];
  for (const name of files) {
    const file = path.join(/* turbopackIgnore: true */ monorepoRoot(), name);
    if (!existsSync(/* turbopackIgnore: true */ file)) continue;
    const parsed = parseEnv(readFileSync(/* turbopackIgnore: true */ file, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined && value !== undefined) process.env[key] = value;
    }
    loaded.push(file);
  }
  return loaded;
}
