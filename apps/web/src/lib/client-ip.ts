import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort visitor IP. Behind a Cloudflare Tunnel every request comes from
 * cloudflared, so the real address is in CF-Connecting-IP.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}
