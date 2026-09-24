import Link from "next/link";
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <VisibilityBadge visibility={project.visibility} />
        </div>
        <Link href={`/p/${project.slug}`} className="btn">
          View {project.visibility === "public" ? "public page" : "preview"} ↗
        </Link>
      </div>
      <AdminProjectTabs projectId={project.id} counts={{ issues: issueCount, fixes: fixCount }} />
      {children}
    </div>
  );
}
