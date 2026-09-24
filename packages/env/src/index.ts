import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

let cachedRoot: string | undefined;

/**
 * Walks up from the current working directory until it finds the
 * monorepo root (the folder holding pnpm-workspace.yaml). Every app and
 * package resolves shared paths from here so they agree on where data lives,
 * no matter which workspace a script is started from.
 */
export function monorepoRoot(): string {
  if (cachedRoot) return cachedRoot;
  let dir = process.cwd();
  while (true) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      cachedRoot = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      cachedRoot = process.cwd();
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
