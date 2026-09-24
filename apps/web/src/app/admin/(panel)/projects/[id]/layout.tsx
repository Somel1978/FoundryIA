import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { and, count, eq, fixSuggestions, getDb, issues } from "@foundry/db";
import { VisibilityBadge } from "@/components/ui";
import { getProjectById } from "@/lib/projects";
import { AdminProjectTabs } from "./admin-project-tabs";

export default async function AdminProjectLayout({ children, params }: LayoutProps<"/admin/projects/[id]">) {
  const project = getProjectById((await params).id);
  const db = getDb();
  const issueCount =
    db
      .select({ n: count() })
      .from(issues)
      .where(and(eq(issues.projectId, project.id), eq(issues.status, "open"), eq(issues.isPublic, false)))
      .get()?.n ?? 0;
  const fixCount =
    db
      .select({ n: count() })
      .from(fixSuggestions)
      .where(and(eq(fixSuggestions.projectId, project.id), eq(fixSuggestions.status, "pending")))
      .get()?.n ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <ProjectThumbnail
            name={project.name}
            mediaId={project.thumbnailMediaId}
            className="aspect-video w-20 shrink-0 rounded-lg border border-border"
                      initialsClassName="text-sm"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">{project.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <VisibilityBadge visibility={project.visibility} />
              <span className="font-mono text-xs text-muted">/p/{project.slug}</span>
            </div>
          </div>
        </div>
        <Link href={`/p/${project.slug}`} className="btn">
          <ExternalLink className="size-4" />
          {project.visibility === "public" ? "Public page" : "Preview"}
        </Link>
      </div>
      <AdminProjectTabs projectId={project.id} counts={{ issues: issueCount, fixes: fixCount }} />
      {children}
    </div>
  );
}
