import Link from "next/link";
import { desc, eq, getDb, snapshots } from "@foundry/db";
import { ConfirmButton } from "@/components/action-form";
import { Badge, EmptyState } from "@/components/ui";
import { CodeUploader } from "@/components/uploaders";
import { removeSnapshot, setCurrentSnapshot } from "@/lib/actions/admin";
import { MAX_UPLOAD_BYTES } from "@/lib/config";
import { formatBytes, formatDateTime } from "@/lib/format";
import { getProjectById } from "@/lib/projects";

export default async function ProjectCodePage({ params }: PageProps<"/admin/projects/[id]/code">) {
  const project = getProjectById((await params).id);
  const list = getDb()
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, project.id))
    .orderBy(desc(snapshots.createdAt))
    .all();

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Upload code</h2>
        <CodeUploader projectId={project.id} maxBytes={MAX_UPLOAD_BYTES} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Snapshots</h2>
        {list.length === 0 ? (
          <EmptyState title="No code uploaded yet" />
        ) : (
          <ul className="card divide-y divide-border">
            {list.map((s) => {
              const live = s.id === project.currentSnapshotId;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{s.message}</span>
                      {live && <Badge color="green">Live</Badge>}
                    </div>
                    <div className="text-xs text-muted">
                      {formatDateTime(s.createdAt)} · {s.fileCount} files · {formatBytes(s.totalBytes)}
                    </div>
                  </div>
                  {live ? (
                    <Link href={`/p/${project.slug}`} className="btn">
                      Browse
                    </Link>
                  ) : (
                    <>
                      <form action={setCurrentSnapshot.bind(null, project.id, s.id)}>
                        <button type="submit" className="btn">
                          Make live
                        </button>
                      </form>
                      <form action={removeSnapshot.bind(null, project.id, s.id)}>
                        <ConfirmButton message="Delete this snapshot? Fix suggestions based on it are deleted too.">
                          Delete
                        </ConfirmButton>
                      </form>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
