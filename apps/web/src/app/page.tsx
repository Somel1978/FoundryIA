import { Boxes, Bug, Download, GitPullRequest } from "lucide-react";
import { and, desc, eq, getDb, releases } from "@foundry/db";
import { ProjectGrid } from "@/components/project-grid";
import { EmptyState } from "@/components/ui";
import { projectDownloadTotals } from "@/lib/downloads";
import { formatDate } from "@/lib/format";
import { listPublicProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

const features = [
  { icon: Boxes, title: "Browse the code", text: "Read every file with syntax highlighting." },
  { icon: Bug, title: "Report issues", text: "Found a bug or have an idea? Tell us." },
  { icon: GitPullRequest, title: "Suggest fixes", text: "Edit a file in your browser and send the change." },
  { icon: Download, title: "Download releases", text: "Grab the latest published builds." },
];

export default function HomePage() {
  const db = getDb();
  const downloads = projectDownloadTotals({ publishedOnly: true });
  const projects = listPublicProjects().map((p) => ({
    downloads: downloads.get(p.id) ?? 0,
    slug: p.slug,
    name: p.name,
    description: p.description,
    thumbnailMediaId: p.thumbnailMediaId,
    updated: formatDate(p.updatedAt),
    latestTag:
      db
        .select({ tag: releases.tag })
        .from(releases)
        .where(and(eq(releases.projectId, p.id), eq(releases.published, true)))
        .orderBy(desc(releases.publishedAt))
        .get()?.tag ?? null,
  }));

  return (
    <div>
      <section className="relative mb-14 overflow-hidden rounded-3xl border border-border bg-surface/50 px-4 py-12 text-center sm:px-12 sm:py-20">
        <div className="bg-grid absolute inset-0 -z-10" />
        <span className="badge mb-6 border-accent/25 bg-accent/10 text-accent">
          <span className="size-1.5 rounded-full bg-accent" /> {projects.length} open project{projects.length === 1 ? "" : "s"}
        </span>
        <h1 className="mx-auto max-w-3xl text-[2.5rem] leading-tight font-bold sm:text-6xl">
          Forged in the <span className="text-gradient">FoundryVTTAI</span> workshop
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Explore the projects, read the source, report issues, propose fixes and download the latest releases.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 text-left lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface/70 p-3.5 backdrop-blur sm:p-4">
              <Icon className="mb-2 size-5 text-accent" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-xs text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Projects</h2>
      </div>
      {projects.length === 0 ? (
        <EmptyState title="No public projects yet" icon={Boxes}>
          Check back soon.
        </EmptyState>
      ) : (
        <ProjectGrid projects={projects} />
      )}
    </div>
  );
}
