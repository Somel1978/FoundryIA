import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-zinc-100 dark:bg-zinc-800">
        <nav className="flex items-center gap-4">
          <span className="font-semibold">Admin</span>
          <Link href="/admin" className="text-zinc-300 hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin/projects/new" className="text-zinc-300 hover:text-white">
            New project
          </Link>
        </nav>
        <form action={logout}>
          <button type="submit" className="text-zinc-300 hover:text-white">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
