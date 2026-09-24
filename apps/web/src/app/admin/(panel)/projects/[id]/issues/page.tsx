import Link from "next/link";
import { desc, eq, getDb, issues } from "@foundry/db";
import { Badge, EmptyState, IssueStatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function AdminIssuesPage({ params }: PageProps<"/admin/projects/[id]/issues">) {
  const project = getProjectById((await params).id);
  const list = getDb()
    .select()
    .from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(desc(issues.number))
    .all();

  if (list.length === 0) return <EmptyState title="No issues suggested yet" />;

  return (
    <ul className="card divide-y divide-border">
      {list.map((issue) => (
        <li key={issue.id}>
          <Link
            href={`/admin/projects/${project.id}/issues/${issue.id}`}
            className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-surface-2"
          >
            <IssueStatusBadge status={issue.status} />
            <span className="min-w-0 flex-1 truncate font-medium">
              <span className="text-muted">#{issue.number}</span> {issue.title}
            </span>
            {issue.isPublic ? <Badge color="green">Listed</Badge> : <Badge color="amber">Hidden</Badge>}
            <span className="text-xs text-muted">
              {issue.authorName} · {formatDateTime(issue.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
