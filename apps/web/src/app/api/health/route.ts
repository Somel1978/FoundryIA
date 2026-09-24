import { getDb, sql } from "@foundry/db";

export const dynamic = "force-dynamic";

/** Liveness check for PM2 / uptime monitors: the process is up and the DB answers. */
export function GET() {
  try {
    getDb().get(sql`select 1`);
    return Response.json({ status: "ok", uptime: Math.round(process.uptime()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
