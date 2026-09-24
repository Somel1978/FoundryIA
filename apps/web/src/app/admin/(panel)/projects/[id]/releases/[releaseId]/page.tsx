import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, getDb, releases } from "@foundry/db";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/action-form";
import { Badge } from "@/components/ui";
import { AssetUploader } from "@/components/uploaders";
import { deleteRelease, removeReleaseAsset, setReleasePublished, updateRelease } from "@/lib/actions/admin";
import { formatBytes, formatDate } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function AdminReleasePage({ params }: PageProps<"/admin/projects/[id]/releases/[releaseId]">) {
  const { id, releaseId } = await params;
  const project = getProjectById(id);
  const release = getDb().query.releases.findFirst({
    where: and(eq(releases.id, releaseId), eq(releases.projectId, project.id)),
    with: { assets: true },
  }).sync();
  if (!release) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/projects/${project.id}/releases`} className="link text-sm">
            ← Releases
          </Link>
          <Badge color="blue">{release.tag}</Badge>
          {release.published ? (
            <Badge color="green">Published {formatDate(release.publishedAt)}</Badge>
          ) : (
            <Badge color="amber">Draft</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <form action={setReleasePublished.bind(null, release.id, !release.published)}>
            <SubmitButton className={release.published ? "btn" : "btn btn-primary"}>
              {release.published ? "Unpublish" : "Publish"}
            </SubmitButton>
          </form>
          <form action={deleteRelease.bind(null, release.id)}>
            <ConfirmButton message="Delete this release and all its files?">Delete</ConfirmButton>
          </form>
        </div>
      </div>
      {release.published && project.visibility !== "public" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          This release is published, but the project is private, so visitors can&apos;t see it yet.
        </p>
      )}

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Files</h2>
        {release.assets.length > 0 && (
          <ul className="mb-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {release.assets.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <a href={`/downloads/${a.id}`} className="link flex-1 truncate font-mono">
                  {a.filename}
                </a>
                <span className="text-xs text-zinc-500">
                  {formatBytes(a.size)} · {a.downloadCount} downloads
                </span>
                <form action={removeReleaseAsset.bind(null, a.id)}>
                  <ConfirmButton message={`Delete ${a.filename}?`} className="btn btn-danger px-2 py-1 text-xs">
                    Remove
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <AssetUploader releaseId={release.id} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Details</h2>
        <ActionForm action={updateRelease.bind(null, release.id)} className="card max-w-2xl space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="tag">Tag</label>
              <input id="tag" name="tag" className="input font-mono" required defaultValue={release.tag} />
            </div>
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" className="input" defaultValue={release.title} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">Release notes</label>
            <textarea id="notes" name="notes" className="input min-h-40 font-mono" defaultValue={release.notes} />
          </div>
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
