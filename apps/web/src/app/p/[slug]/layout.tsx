import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq, getDb, issues, releases } from "@foundry/db";
import { VisibilityBadge } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { findViewableProject, getViewableProject } from "@/lib/projects";
import { ProjectTabs } from "./project-tabs";

export async function generateMetadata({ params }: LayoutProps<"/p/[slug]">): Promise<Metadata> {
  const project = await findViewableProject((await params).slug);
  return project ? { title: project.name, description: project.description } : {};
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
  const releaseCount =
    db
      .select({ n: count() })
      .from(releases)
      .where(and(eq(releases.projectId, project.id), eq(releases.published, true)))
      .get()?.n ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              <Link href={`/p/${project.slug}`}>{project.name}</Link>
            </h1>
            {project.visibility !== "public" && <VisibilityBadge visibility={project.visibility} />}
          </div>
          {project.description && <p className="mt-1 max-w-3xl text-zinc-500">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          {project.currentSnapshotId && (
            <a href={`/p/${project.slug}/archive`} className="btn">
              Download source
            </a>
          )}
          {admin && (
            <Link href={`/admin/projects/${project.id}`} className="btn">
              Manage
            </Link>
          )}
        </div>
      </div>
      <ProjectTabs slug={project.slug} issueCount={issueCount} releaseCount={releaseCount} />
      {children}
    </div>
  );
}
