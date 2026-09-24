import Link from "next/link";
import { desc, eq, fixSuggestions, getDb } from "@foundry/db";
import { EmptyState, FixStatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function AdminFixesPage({ params }: PageProps<"/admin/projects/[id]/fixes">) {
  const project = getProjectById((await params).id);
  const list = getDb()
    .select()
    .from(fixSuggestions)
    .where(eq(fixSuggestions.projectId, project.id))
    .orderBy(desc(fixSuggestions.createdAt))
    .all();

  if (list.length === 0) return <EmptyState title="No fixes suggested yet" />;

  return (
    <ul className="card divide-y divide-border">
      {list.map((fix) => (
        <li key={fix.id}>
          <Link
            href={`/admin/projects/${project.id}/fixes/${fix.id}`}
            className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-surface-2"
          >
            <FixStatusBadge status={fix.status} />
            <span className="min-w-0 flex-1 truncate font-medium">{fix.title}</span>
            <span className="font-mono text-xs text-muted">{fix.filePath}</span>
            <span className="text-xs text-muted">
              {fix.authorName} · {formatDateTime(fix.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
