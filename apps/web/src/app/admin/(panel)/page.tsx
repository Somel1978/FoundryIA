import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, fixSuggestions, getDb, issues, projects } from "@foundry/db";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

export default function AdminDashboard() {
  const db = getDb();
  const list = db.select().from(projects).orderBy(desc(projects.updatedAt)).all();

  const pendingFixes = new Map(
    db
      .select({ projectId: fixSuggestions.projectId, n: count() })
      .from(fixSuggestions)
      .where(eq(fixSuggestions.status, "pending"))
      .groupBy(fixSuggestions.projectId)
      .all()
      .map((r) => [r.projectId, r.n]),
  );
  // "Needs review" = open issues not yet published.
  const newIssues = new Map(
    db
      .select({ projectId: issues.projectId, n: count() })
      .from(issues)
      .where(and(eq(issues.status, "open"), eq(issues.isPublic, false)))
      .groupBy(issues.projectId)
      .all()
      .map((r) => [r.projectId, r.n]),
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage code, visibility, releases and community suggestions."
        actions={
          <Link href="/admin/projects/new" className="btn btn-primary">
            New project
          </Link>
        }
      />
      {list.length === 0 ? (
        <EmptyState title="No projects yet">
          <Link href="/admin/projects/new" className="link">
            Create your first project
          </Link>
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-left text-xs text-zinc-500 uppercase dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 font-medium">Issues to review</th>
                <th className="px-4 py-3 font-medium">Pending fixes</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <div className="font-mono text-xs text-zinc-500">/p/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <VisibilityBadge visibility={p.visibility} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}/issues`} className="hover:underline">
                      {newIssues.get(p.id) ?? 0}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}/fixes`} className="hover:underline">
                      {pendingFixes.get(p.id) ?? 0}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
