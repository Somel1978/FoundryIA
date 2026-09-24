import Link from "next/link";
import { and, desc, eq, getDb, releases } from "@foundry/db";
import { EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listPublicProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const projects = listPublicProjects();
  const db = getDb();

  return (
    <div>
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 max-w-2xl text-zinc-500">
          Browse the source, report issues, propose fixes and grab the latest releases.
        </p>
      </section>

      {projects.length === 0 ? (
        <EmptyState title="No public projects yet">Check back soon.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const latest = db
              .select({ tag: releases.tag })
              .from(releases)
              .where(and(eq(releases.projectId, p.id), eq(releases.published, true)))
              .orderBy(desc(releases.publishedAt))
              .get();
            return (
              <li key={p.id}>
                <Link
                  href={`/p/${p.slug}`}
                  className="card flex h-full flex-col p-5 transition hover:border-accent/60 hover:shadow-md"
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="mt-1 line-clamp-3 flex-1 text-sm text-zinc-500">
                    {p.description || "No description."}
                  </span>
                  <span className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>Updated {formatDate(p.updatedAt)}</span>
                    {latest && <span className="font-mono">{latest.tag}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
