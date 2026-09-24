import type { Metadata } from "next";
import Link from "next/link";
import { CircleDot, Download, FolderGit2, GitPullRequestArrow, Plus } from "lucide-react";
import { and, count, desc, eq, fixSuggestions, getDb, issues, projects, releaseAssets, sql } from "@foundry/db";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

function countBy<T extends string>(rows: { k: T; n: number }[]) {
  return new Map(rows.map((r) => [r.k, r.n]));
}

export default function AdminDashboard() {
  const db = getDb();
  const list = db.select().from(projects).orderBy(desc(projects.updatedAt)).all();
  const pendingFixes = countBy(
    db
      .select({ k: fixSuggestions.projectId, n: count() })
      .from(fixSuggestions)
      .where(eq(fixSuggestions.status, "pending"))
      .groupBy(fixSuggestions.projectId)
      .all(),
  );
  // "Needs review" = open issues not yet published.
  const newIssues = countBy(
    db
      .select({ k: issues.projectId, n: count() })
      .from(issues)
      .where(and(eq(issues.status, "open"), eq(issues.isPublic, false)))
      .groupBy(issues.projectId)
      .all(),
  );
  const downloads = db.select({ n: sql<number>`coalesce(sum(${releaseAssets.downloadCount}), 0)` }).from(releaseAssets).get()?.n ?? 0;
  const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Projects", value: list.length, icon: FolderGit2 },
    { label: "Issues to review", value: sum(newIssues), icon: CircleDot },
    { label: "Pending fixes", value: sum(pendingFixes), icon: GitPullRequestArrow },
    { label: "Downloads", value: downloads, icon: Download },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Manage code, visibility, media, releases and community suggestions."
        actions={
          <Link href="/admin/projects/new" className="btn btn-primary">
            <Plus className="size-4" /> New project
          </Link>
        }
      />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-sm">{label}</span>
              <Icon className="size-4" />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No projects yet" icon={FolderGit2}>
          <Link href="/admin/projects/new" className="link">
            Create your first project
          </Link>
        </EmptyState>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {list.map((p) => {
            const toReview = newIssues.get(p.id) ?? 0;
            const fixes = pendingFixes.get(p.id) ?? 0;
            return (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="flex flex-wrap items-center gap-4 px-4 py-3 transition hover:bg-surface-2 sm:flex-nowrap"
              >
                <ProjectThumbnail
                  name={p.name}
                  mediaId={p.thumbnailMediaId}
                  className="aspect-video w-24 shrink-0 rounded-lg border border-border"
                      initialsClassName="text-base"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    <VisibilityBadge visibility={p.visibility} />
                  </div>
                  <div className="font-mono text-xs text-muted">/p/{p.slug}</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span className={`flex items-center gap-1.5 ${toReview ? "text-sky-600 dark:text-sky-400" : ""}`} title="Issues to review">
                    <CircleDot className="size-4" /> {toReview}
                  </span>
                  <span className={`flex items-center gap-1.5 ${fixes ? "text-amber-600 dark:text-amber-400" : ""}`} title="Pending fixes">
                    <GitPullRequestArrow className="size-4" /> {fixes}
                  </span>
                  <span className="hidden w-24 text-right md:block">{formatDate(p.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
