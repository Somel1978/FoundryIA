import { jwtVerify, SignJWT } from "jose";

/** Edge-safe session helpers (shared by proxy.ts and server code). */

export const SESSION_COOKIE = "foundry_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

let warned = false;

function secretKey(): Uint8Array {
  let secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
    }
    if (!warned) {
      console.warn("[auth] SESSION_SECRET missing/short; using an insecure development secret.");
      warned = true;
    }
    secret = `dev-only-insecure-secret::${process.env.ADMIN_PASSWORD ?? ""}`;
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
