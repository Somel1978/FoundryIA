import Link from "next/link";
import { ExternalLink, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { asc, getDb, projects } from "@foundry/db";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const list = getDb()
    .select({ id: projects.id, name: projects.name, thumbnailMediaId: projects.thumbnailMediaId })
    .from(projects)
    .orderBy(asc(projects.name))
    .all();

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-3">
          <p className="px-2 pt-1 pb-2 text-xs font-semibold tracking-wider text-muted uppercase">Admin</p>
          <nav className="flex flex-col gap-0.5 text-sm">
            <Link href="/admin" className="btn btn-ghost justify-start">
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link href="/admin/projects/new" className="btn btn-ghost justify-start">
              <Plus className="size-4" /> New project
            </Link>
          </nav>
          {list.length > 0 && (
            <>
              <p className="px-2 pt-4 pb-2 text-xs font-semibold tracking-wider text-muted uppercase">Projects</p>
              <nav className="flex max-h-80 flex-col gap-0.5 overflow-y-auto text-sm">
                {list.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/projects/${p.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-surface-2"
                  >
                    <ProjectThumbnail
                      name={p.name}
                      mediaId={p.thumbnailMediaId}
                      className="size-6 shrink-0 rounded-md"
                      initialsClassName="text-[9px]"
                    />
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
              </nav>
            </>
          )}
          <div className="mt-4 flex flex-col gap-0.5 border-t border-border pt-3 text-sm">
            <Link href="/" className="btn btn-ghost justify-start">
              <ExternalLink className="size-4" /> View site
            </Link>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost w-full justify-start text-muted">
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
