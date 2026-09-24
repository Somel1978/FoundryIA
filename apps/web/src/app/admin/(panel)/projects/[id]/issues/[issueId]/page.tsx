import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, getDb, ISSUE_STATUS, issues } from "@foundry/db";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/action-form";
import { Markdown } from "@/components/markdown";
import { IssueStatusBadge } from "@/components/ui";
import { deleteIssue, updateIssue } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function AdminIssuePage({ params }: PageProps<"/admin/projects/[id]/issues/[issueId]">) {
  const { id, issueId } = await params;
  const project = getProjectById(id);
  const issue = getDb()
    .select()
    .from(issues)
    .where(and(eq(issues.id, issueId), eq(issues.projectId, project.id)))
    .get();
  if (!issue) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <article className="space-y-4">
        <Link href={`/admin/projects/${project.id}/issues`} className="link text-sm">
          ← Issues
        </Link>
        <h2 className="text-xl font-semibold">
          {issue.title} <span className="font-normal text-zinc-400">#{issue.number}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <IssueStatusBadge status={issue.status} />
          by {issue.authorName}
          {issue.authorEmail && (
            <a href={`mailto:${issue.authorEmail}`} className="link">
              &lt;{issue.authorEmail}&gt;
            </a>
          )}
          · {formatDateTime(issue.createdAt)}
        </div>
        <div className="card p-6">
          <Markdown>{issue.body}</Markdown>
        </div>
      </article>

      <aside className="space-y-4">
        <ActionForm action={updateIssue.bind(null, issue.id)} className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" className="input" defaultValue={issue.status}>
              {ISSUE_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" defaultChecked={issue.isPublic} />
            List publicly on the project page
          </label>
          <div>
            <label className="label" htmlFor="adminNote">Public response</label>
            <textarea id="adminNote" name="adminNote" className="input min-h-28" defaultValue={issue.adminNote} />
            <p className="hint">Shown under the issue when it&apos;s listed.</p>
          </div>
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
        <form action={deleteIssue.bind(null, issue.id)}>
          <ConfirmButton message="Delete this issue permanently?">Delete issue</ConfirmButton>
        </form>
      </aside>
    </div>
  );
}
