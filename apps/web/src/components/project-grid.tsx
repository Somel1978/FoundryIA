"use client";

import Link from "next/link";
import { ArrowUpRight, Download, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCount } from "@/lib/format";
import { ProjectThumbnail } from "./project-thumbnail";

export interface ProjectCard {
  slug: string;
  name: string;
  description: string;
  thumbnailMediaId: string | null;
  latestTag: string | null;
  updated: string;
  downloads: number;
}

export function ProjectGrid({ projects }: { projects: ProjectCard[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(needle));
  }, [projects, q]);

  return (
    <div>
      {projects.length > 3 && (
        <div className="relative mb-6 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="input h-11 pl-10"
            aria-label="Search projects"
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted">No projects match “{q}”.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/p/${p.slug}`}
                className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10"
              >
                <div className="relative aspect-video overflow-hidden border-b border-border">
                  <ProjectThumbnail
                    name={p.name}
                    mediaId={p.thumbnailMediaId}
                    className="size-full transition duration-500 group-hover:scale-105"
                  />
                  {p.latestTag && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-mono text-xs text-white backdrop-blur">
                      <Tag className="size-3" />
                      {p.latestTag}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">{p.name}</h2>
                    <ArrowUpRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                  </div>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{p.description || "No description yet."}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted">
                    <span>Updated {p.updated}</span>
                    {p.latestTag && (
                      <span className="inline-flex items-center gap-1" title="Release downloads">
                        <Download className="size-3.5" /> {formatCount(p.downloads)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
