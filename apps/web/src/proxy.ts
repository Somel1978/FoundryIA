import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

/**
 * Origin the browser used. Behind a Cloudflare Tunnel, request.url carries the
 * internal address (localhost:PORT); cloudflared forwards the public host in
 * Host and the scheme in X-Forwarded-Proto.
 */
function publicOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (!host) return request.nextUrl.origin;
  return `${proto === "https" ? "https" : proto === "http" ? "http" : request.nextUrl.protocol.replace(":", "")}://${host}`;
}

/**
 * First line of defence for the admin UI. Every admin page, action and API
 * route also checks the session itself (see lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!(await verifySession(request.cookies.get(SESSION_COOKIE)?.value))) {
    const url = new URL("/admin/login", publicOrigin(request));
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
