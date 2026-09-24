import { notFound } from "next/navigation";
import { and, eq, getDb, issues } from "@foundry/db";
import { Markdown } from "@/components/markdown";
import { IssueStatusBadge } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getViewableProject } from "@/lib/projects";

export default async function IssuePage({ params }: PageProps<"/p/[slug]/issues/[number]">) {
  const { slug, number } = await params;
  const project = await getViewableProject(slug);
  const n = Number(number);
  if (!Number.isInteger(n)) notFound();
  const issue = getDb()
    .select()
    .from(issues)
    .where(and(eq(issues.projectId, project.id), eq(issues.number, n)))
    .get();
  if (!issue || (!issue.isPublic && !(await isAdmin()))) notFound();

  return (
    <article className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          {issue.title} <span className="font-normal text-zinc-400">#{issue.number}</span>
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <IssueStatusBadge status={issue.status} />
          opened by {issue.authorName} on {formatDateTime(issue.createdAt)}
        </div>
      </div>
      <div className="card p-6">
        <Markdown>{issue.body}</Markdown>
      </div>
      {issue.adminNote && (
        <div className="card border-accent/40 p-6">
          <p className="mb-2 text-sm font-medium text-accent">Maintainer response</p>
          <Markdown>{issue.adminNote}</Markdown>
        </div>
      )}
    </article>
  );
}
