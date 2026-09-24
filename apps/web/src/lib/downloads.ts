import "server-only";
import { eq, getDb, releaseAssets, releases, sql } from "@foundry/db";

const total = sql<number>`coalesce(sum(${releaseAssets.downloadCount}), 0)`;

/** Downloads per release of one project (releases without files are absent → 0). */
export function releaseDownloadTotals(projectId: string): Map<string, number> {
  const rows = getDb()
    .select({ releaseId: releaseAssets.releaseId, n: total })
    .from(releaseAssets)
    .innerJoin(releases, eq(releases.id, releaseAssets.releaseId))
    .where(eq(releases.projectId, projectId))
    .groupBy(releaseAssets.releaseId)
    .all();
  return new Map(rows.map((r) => [r.releaseId, Number(r.n)]));
}

/** Downloads per project, across all its releases. Pass publishedOnly for public figures. */
export function projectDownloadTotals({ publishedOnly = false } = {}): Map<string, number> {
  const rows = getDb()
    .select({ projectId: releases.projectId, n: total })
    .from(releaseAssets)
    .innerJoin(releases, eq(releases.id, releaseAssets.releaseId))
    .where(publishedOnly ? eq(releases.published, true) : undefined)
    .groupBy(releases.projectId)
    .all();
  return new Map(rows.map((r) => [r.projectId, Number(r.n)]));
}
