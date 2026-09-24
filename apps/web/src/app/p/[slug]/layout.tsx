import type { Metadata } from "next";
import Link from "next/link";
import { Download, Package, Settings2 } from "lucide-react";
import { projectDownloadTotals } from "@/lib/downloads";
import { and, count, desc, eq, getDb, issues, releases } from "@foundry/db";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { Badge, VisibilityBadge } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { downloadsLabel, formatDate } from "@/lib/format";
import { findViewableProject, getViewableProject } from "@/lib/projects";
import { ProjectTabs } from "./project-tabs";

export async function generateMetadata({ params }: LayoutProps<"/p/[slug]">): Promise<Metadata> {
  const project = await findViewableProject((await params).slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.description,
    openGraph: project.thumbnailMediaId ? { images: [`/media/${project.thumbnailMediaId}`] } : undefined,
  };
}

export default async function ProjectLayout({ children, params }: LayoutProps<"/p/[slug]">) {
  const project = await getViewableProject((await params).slug);
  const admin = await isAdmin();
  const db = getDb();
  const issueCount =
    db
      .select({ n: count() })
      .from(issues)
      .where(and(eq(issues.projectId, project.id), eq(issues.isPublic, true), eq(issues.status, "open")))
      .get()?.n ?? 0;
  const published = and(eq(releases.projectId, project.id), eq(releases.published, true));
  const releaseCount = db.select({ n: count() }).from(releases).where(published).get()?.n ?? 0;
  const downloads = projectDownloadTotals({ publishedOnly: true }).get(project.id) ?? 0;
  const latest = db.select().from(releases).where(published).orderBy(desc(releases.publishedAt)).get();

  return (
    <div>
      <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr] md:items-center md:gap-10">
        <ProjectThumbnail
          name={project.name}
          mediaId={project.thumbnailMediaId}
          className="aspect-video w-full rounded-2xl border border-border shadow-xl shadow-black/10"
        />
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {project.visibility !== "public" && <VisibilityBadge visibility={project.visibility} />}
            {latest && (
              <Badge color="violet">
                <Package className="size-3" /> {latest.tag}
              </Badge>
            )}
            {releaseCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Download className="size-3.5" /> {downloadsLabel(downloads)}
              </span>
            )}
            <span className="text-xs text-muted">Updated {formatDate(project.updatedAt)}</span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            <Link href={`/p/${project.slug}`}>{project.name}</Link>
          </h1>
          {project.description && <p className="mt-3 max-w-2xl text-lg text-muted">{project.description}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {latest && (
              <Link href={`/p/${project.slug}/releases`} className="btn btn-primary">
                <Package className="size-4" /> Get {latest.tag}
              </Link>
            )}
            {project.currentSnapshotId && (
              <a href={`/p/${project.slug}/archive`} className="btn">
                <Download className="size-4" /> Source .zip
              </a>
            )}
            {admin && (
              <Link href={`/admin/projects/${project.id}`} className="btn btn-ghost">
                <Settings2 className="size-4" /> Manage
              </Link>
            )}
          </div>
        </div>
      </section>
      <ProjectTabs slug={project.slug} issueCount={issueCount} releaseCount={releaseCount} />
      {children}
    </div>
  );
}
