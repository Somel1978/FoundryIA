import Link from "next/link";
import { desc, eq, getDb, releases } from "@foundry/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, EmptyState } from "@/components/ui";
import { createRelease } from "@/lib/actions/admin";
import { Download } from "lucide-react";
import { releaseDownloadTotals } from "@/lib/downloads";
import { downloadsLabel, formatDate } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function AdminReleasesPage({ params }: PageProps<"/admin/projects/[id]/releases">) {
  const project = getProjectById((await params).id);
  const list = getDb().query.releases.findMany({
    where: eq(releases.projectId, project.id),
    orderBy: desc(releases.createdAt),
    with: { assets: { columns: { id: true } } },
  }).sync();

  const totals = releaseDownloadTotals(project.id);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section>
        <h2 className="mb-3 font-semibold">Releases</h2>
        {list.length === 0 ? (
          <EmptyState title="No releases yet" />
        ) : (
          <ul className="card divide-y divide-border">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/projects/${project.id}/releases/${r.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-2"
                >
                  <Badge color="blue">{r.tag}</Badge>
                  <span className="flex-1 font-medium">{r.title}</span>
                  <span className="text-xs text-muted">{r.assets.length} files</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <Download className="size-3.5" /> {downloadsLabel(totals.get(r.id) ?? 0)}
                  </span>
                  {r.published ? (
                    <Badge color="green">Published {formatDate(r.publishedAt)}</Badge>
                  ) : (
                    <Badge color="amber">Draft</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">New release</h2>
        <ActionForm action={createRelease.bind(null, project.id)} className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="tag">Tag</label>
            <input id="tag" name="tag" className="input font-mono" required maxLength={64} placeholder="v1.0.0" />
          </div>
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" className="input" maxLength={200} placeholder="Defaults to the tag" />
          </div>
          <div>
            <label className="label" htmlFor="notes">Release notes</label>
            <textarea id="notes" name="notes" className="input min-h-28" placeholder="Markdown supported" />
          </div>
          <p className="hint">Releases start as drafts. Add files, then publish.</p>
          <SubmitButton>Create draft</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
