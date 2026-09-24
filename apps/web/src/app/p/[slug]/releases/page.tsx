import { and, desc, eq, getDb, releases } from "@foundry/db";
import { Markdown } from "@/components/markdown";
import { Badge, EmptyState } from "@/components/ui";
import { formatBytes, formatDate } from "@/lib/format";
import { getViewableProject } from "@/lib/projects";

export default async function ReleasesPage({ params }: PageProps<"/p/[slug]/releases">) {
  const project = await getViewableProject((await params).slug);
  const list = getDb().query.releases.findMany({
    where: and(eq(releases.projectId, project.id), eq(releases.published, true)),
    orderBy: desc(releases.publishedAt),
    with: { assets: true },
  }).sync();

  if (list.length === 0) return <EmptyState title="No releases yet" />;

  return (
    <div className="space-y-6">
      {list.map((release, i) => (
        <section key={release.id} id={release.tag} className="card p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{release.title}</h2>
            <Badge color="blue">{release.tag}</Badge>
            {i === 0 && <Badge color="green">Latest</Badge>}
            <span className="text-sm text-zinc-500">{formatDate(release.publishedAt)}</span>
          </div>
          {release.notes && <Markdown>{release.notes}</Markdown>}
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-500">Assets</h3>
            {release.assets.length === 0 ? (
              <p className="text-sm text-zinc-500">No downloadable files.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {release.assets.map((asset) => (
                  <li key={asset.id} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                    <a href={`/downloads/${asset.id}`} className="link truncate font-mono">
                      {asset.filename}
                    </a>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatBytes(asset.size)} · {asset.downloadCount} downloads
                    </span>
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
