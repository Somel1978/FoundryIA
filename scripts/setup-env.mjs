#!/usr/bin/env node
// Creates (or updates) the .env file at the monorepo root.
// Usage: pnpm setup-env
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ask, askNewPassword, hashPassword } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

console.log(`Setting up ${envPath}\n`);

let lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
if (lines.length > 0) {
  const answer = (await ask(".env already exists. Update the admin password in it? [y/N] ")).trim().toLowerCase();
  if (answer !== "y" && answer !== "yes") {
    console.log("Nothing changed.");
    process.exit(0);
  }
}

const password = await askNewPassword();

function setVar(key, value) {
  const i = lines.findIndex((l) => new RegExp(`^\\s*#?\\s*${key}=`).test(l));
  if (i >= 0) lines[i] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
}
const has = (key) => lines.some((l) => new RegExp(`^\\s*${key}=.+`).test(l));

if (lines.length === 0) {
  lines = [
    "# Created by `pnpm setup-env`. Restart the server after editing.",
    "# This file holds secrets: it is git-ignored, keep it out of version control.",
    "",
  ];
}
setVar("ADMIN_PASSWORD_HASH", hashPassword(password));
// A plain ADMIN_PASSWORD would be ignored in favour of the hash; drop it to avoid confusion.
lines = lines.filter((l) => !/^\s*ADMIN_PASSWORD=/.test(l));
if (!has("SESSION_SECRET")) setVar("SESSION_SECRET", randomBytes(48).toString("base64url"));
if (!lines.some((l) => l.includes("DATA_DIR"))) {
  lines.push(
    "",
    "# Optional settings (see .env.example):",
    "# DATA_DIR=/var/lib/foundry",
    "# MAX_UPLOAD_MB=100",
    "# ALLOWED_ORIGINS=code.example.com",
    "# PORT only works as a real environment variable, e.g. PORT=3000 pnpm start",
  );
}

writeFileSync(envPath, lines.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
console.log(`\n✓ Wrote ${envPath}`);
console.log("  Restart the server (pnpm start) and sign in at /admin with that password.");
