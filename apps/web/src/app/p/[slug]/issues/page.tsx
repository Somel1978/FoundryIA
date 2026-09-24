import Link from "next/link";
import { and, desc, eq, getDb, issues } from "@foundry/db";
import { EmptyState, IssueStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { canSuggest, getViewableProject } from "@/lib/projects";

export default async function IssuesPage({ params }: PageProps<"/p/[slug]/issues">) {
  const project = await getViewableProject((await params).slug);
  const list = getDb()
    .select()
    .from(issues)
    .where(and(eq(issues.projectId, project.id), eq(issues.isPublic, true)))
    .orderBy(desc(issues.number))
    .all();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">Issues are published after review.</p>
        {canSuggest(project) && (
          <Link href={`/p/${project.slug}/issues/new`} className="btn btn-primary">
            Suggest an issue
          </Link>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState title="No issues yet" />
      ) : (
        <ul className="card divide-y divide-border">
          {list.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`/p/${project.slug}/issues/${issue.number}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <IssueStatusBadge status={issue.status} />
                <span className="flex-1 font-medium">{issue.title}</span>
                <span className="text-xs text-muted">
                  #{issue.number} · {issue.authorName} · {formatDate(issue.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
