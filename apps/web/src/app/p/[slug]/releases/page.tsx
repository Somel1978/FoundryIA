import { Download, FileArchive, Package } from "lucide-react";
import { and, desc, eq, getDb, releases } from "@foundry/db";
import { Markdown } from "@/components/markdown";
import { Badge, EmptyState } from "@/components/ui";
import { releaseDownloadTotals } from "@/lib/downloads";
import { downloadsLabel, formatBytes, formatDate } from "@/lib/format";
import { getViewableProject } from "@/lib/projects";

export default async function ReleasesPage({ params }: PageProps<"/p/[slug]/releases">) {
  const project = await getViewableProject((await params).slug);
  const list = getDb().query.releases.findMany({
    where: and(eq(releases.projectId, project.id), eq(releases.published, true)),
    orderBy: desc(releases.publishedAt),
    with: { assets: true },
  }).sync();

  const totals = releaseDownloadTotals(project.id);
  if (list.length === 0) return <EmptyState title="No releases yet" icon={Package} />;

  return (
    <div className="space-y-6">
      {list.map((release, i) => (
        <section
          key={release.id}
          id={release.tag}
          className={`card p-6 sm:p-8 ${i === 0 ? "border-accent/40 shadow-xl shadow-accent/5" : ""}`}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold">{release.title}</h2>
            <Badge color="blue">{release.tag}</Badge>
            {i === 0 && <Badge color="green">Latest</Badge>}
            <span className="text-sm text-muted">{formatDate(release.publishedAt)}</span>
            {release.assets.length > 0 && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted">
                <Download className="size-4" /> {downloadsLabel(totals.get(release.id) ?? 0)}
              </span>
            )}
          </div>
          {release.notes && <Markdown>{release.notes}</Markdown>}
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-muted">Assets</h3>
            {release.assets.length === 0 ? (
              <p className="text-sm text-muted">No downloadable files.</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {release.assets.map((asset) => (
                  <li key={asset.id}>
                    <a
                      href={`/downloads/${asset.id}`}
                      className="group flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-surface-2"
                    >
                      <FileArchive className="size-4 shrink-0 text-accent" />
                      <span className="flex-1 truncate font-mono group-hover:text-accent">{asset.filename}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatBytes(asset.size)} · {downloadsLabel(asset.downloadCount)}
                      </span>
                      <Download className="size-4 shrink-0 text-muted group-hover:text-accent" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
