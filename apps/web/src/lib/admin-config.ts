import "server-only";
import { scryptSync, timingSafeEqual, createHash } from "node:crypto";

/**
 * Admin credentials come from either (`pnpm setup-env` writes the hash to .env):
 *   ADMIN_PASSWORD_HASH  – output of `pnpm hash-password` (recommended; safe
 *                          for any characters, nothing in plain text), or
 *   ADMIN_PASSWORD       – the password itself.
 *
 * Note: Next.js expands `$VAR` inside .env files, even in quotes, so a plain
 * password containing `$` gets silently mangled. Use the hash, or write `\$`.
 */

const HASH_PREFIX = "scrypt:";

function plainPassword(): string | undefined {
  // Strip stray whitespace / Windows line endings from copy-pasted values.
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value || undefined;
}

function passwordHash(): string | undefined {
  const value = process.env.ADMIN_PASSWORD_HASH?.trim();
  return value || undefined;
}

function parseHash(value: string): { salt: Buffer; hash: Buffer } | null {
  if (!value.startsWith(HASH_PREFIX)) return null;
  const [salt, hash] = value.slice(HASH_PREFIX.length).split(":");
  if (!salt || !hash) return null;
  return { salt: Buffer.from(salt, "base64url"), hash: Buffer.from(hash, "base64url") };
}

export function hashPassword(password: string, salt: Buffer): string {
  const hash = scryptSync(password, salt, 32);
  return `${HASH_PREFIX}${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyAdminPassword(candidate: string): boolean {
  const stored = passwordHash();
  if (stored) {
    const parsed = parseHash(stored);
    if (!parsed) return false;
    return timingSafeEqual(scryptSync(candidate, parsed.salt, parsed.hash.length), parsed.hash);
  }
  const expected = plainPassword();
  if (!expected) return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Human-readable reasons why admin login can't work with the current env. */
export function adminConfigProblems(): string[] {
  const problems: string[] = [];
  const hash = passwordHash();
  const plain = plainPassword();
  if (hash) {
    if (!parseHash(hash)) {
      problems.push("ADMIN_PASSWORD_HASH is malformed. Generate it with `pnpm hash-password`.");
    }
  } else if (!plain) {
    problems.push(
      "No admin password configured. Run `pnpm setup-env` in the project folder to create the .env file, then restart the server.",
    );
  } else if (process.env.NODE_ENV === "production" && plain.length < 12) {
    problems.push(
      `ADMIN_PASSWORD is only ${plain.length} characters long; use at least 12. (If your password contains "$", it was cut short by .env variable expansion — use ADMIN_PASSWORD_HASH instead.)`,
    );
  }
  const secret = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    problems.push("SESSION_SECRET must be set to at least 32 characters. `pnpm setup-env` generates one.");
  }
  return problems;
}
