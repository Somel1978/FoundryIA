import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminConfigProblems, verifyAdminPassword } from "./admin-config";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export { adminConfigProblems };

export function checkPassword(candidate: string): boolean {
  return adminConfigProblems().length === 0 && verifyAdminPassword(candidate);
}

/**
 * Whether the browser reached us over HTTPS. Through a Cloudflare Tunnel the
 * app itself speaks plain HTTP, so look at what the browser saw: the Origin
 * of the form post, or X-Forwarded-Proto set by cloudflared.
 */
async function requestIsHttps(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin.startsWith("https://");
  return h.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

export async function startSession(): Promise<void> {
  // A Secure cookie is silently dropped by browsers on plain http://<lan-ip>,
  // which looks like "the password doesn't work". Match the actual scheme
  // unless COOKIE_SECURE forces it.
  const forced = process.env.COOKIE_SECURE;
  const secure = forced === "true" ? true : forced === "false" ? false : await requestIsHttps();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin page, server action and admin route handler. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
