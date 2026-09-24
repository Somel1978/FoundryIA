import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, fixSuggestions, getDb } from "@foundry/db";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/action-form";
import { DiffView } from "@/components/diff-view";
import { Markdown } from "@/components/markdown";
import { FixStatusBadge } from "@/components/ui";
import { applyFix, deleteFix, setFixStatus } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function AdminFixPage({ params }: PageProps<"/admin/projects/[id]/fixes/[fixId]">) {
  const { id, fixId } = await params;
  const project = getProjectById(id);
  const fix = getDb()
    .select()
    .from(fixSuggestions)
    .where(and(eq(fixSuggestions.id, fixId), eq(fixSuggestions.projectId, project.id)))
    .get();
  if (!fix) notFound();
  const outdated = fix.status === "pending" && fix.baseSnapshotId !== project.currentSnapshotId;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={`/admin/projects/${project.id}/fixes`} className="link text-sm">
          ← Fix suggestions
        </Link>
        <h2 className="text-xl font-semibold">{fix.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <FixStatusBadge status={fix.status} />
          <span className="font-mono">{fix.filePath}</span>· by {fix.authorName}
          {fix.authorEmail && (
            <a href={`mailto:${fix.authorEmail}`} className="link">
              &lt;{fix.authorEmail}&gt;
            </a>
          )}
          · {formatDateTime(fix.createdAt)}
        </div>
      </div>

      {fix.description && (
        <div className="card p-6">
          <Markdown>{fix.description}</Markdown>
        </div>
      )}

      <DiffView diff={fix.diff} />

      {fix.status === "applied" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Fix applied — it&apos;s part of the live code.{" "}
          <Link href={`/admin/projects/${project.id}/code`} className="underline">
            View snapshots
          </Link>
        </p>
      )}

      {outdated && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          The live code changed since this fix was suggested. Applying it will re-apply the diff on top of the current
          version and fail if it conflicts.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {fix.status === "pending" && (
          <ActionForm action={applyFix.bind(null, fix.id)} className="card space-y-4 p-5">
            <h3 className="font-semibold">Apply</h3>
            <p className="text-sm text-zinc-500">Creates a new live snapshot of the code with this change.</p>
            <textarea name="adminNote" className="input min-h-20" placeholder="Note (optional)" />
            <SubmitButton pendingText="Applying…">Apply fix</SubmitButton>
          </ActionForm>
        )}
        <ActionForm action={setFixStatus.bind(null, fix.id)} className="card space-y-4 p-5">
          <h3 className="font-semibold">{fix.status === "rejected" ? "Rejected" : "Reject"}</h3>
          <textarea name="adminNote" className="input min-h-20" placeholder="Reason (optional)" defaultValue={fix.adminNote} />
          {fix.status === "rejected" ? (
            <SubmitButton name="status" value="pending" className="btn">
              Reopen
            </SubmitButton>
          ) : fix.status === "pending" ? (
            <SubmitButton name="status" value="rejected" className="btn btn-danger">
              Reject
            </SubmitButton>
          ) : (
            <p className="text-sm text-zinc-500">Already applied.</p>
          )}
        </ActionForm>
      </div>

      <form action={deleteFix.bind(null, fix.id)}>
        <ConfirmButton message="Delete this suggestion permanently?">Delete suggestion</ConfirmButton>
      </form>
    </div>
  );
}
