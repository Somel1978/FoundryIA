import Link from "next/link";
import { BookOpen, ChevronRight, CornerLeftUp, FileCode2, FileText, Folder, GitPullRequestArrow, FileDown } from "lucide-react";
import { notFound } from "next/navigation";
import type { Project } from "@foundry/db";
import { readSnapshotFile, statPath, UnsafePathError, type PathInfo } from "@foundry/storage";
import { encodePath, formatBytes } from "@/lib/format";
import { highlight } from "@/lib/highlight";
import { canSuggest } from "@/lib/projects";
import { Markdown } from "./markdown";
import { EmptyState } from "./ui";

async function safeStat(snapshotId: string, path: string): Promise<PathInfo> {
  try {
    return await statPath(snapshotId, path);
  } catch (err) {
    if (err instanceof UnsafePathError) return null;
    throw err;
  }
}

function Breadcrumbs({ slug, path }: { slug: string; path: string }) {
  const parts = path ? path.split("/") : [];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1 font-mono text-sm">
      <Link href={`/p/${slug}`} className="link">
        {slug}
      </Link>
      {parts.map((part, i) => {
        const sub = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={sub} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted" />
            {last ? (
              <span className="font-semibold">{part}</span>
            ) : (
              <Link href={`/p/${slug}/tree/${encodePath(sub)}`} className="link">
                {part}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}

const TEXT_EXT = /\.(md|markdown|txt|rst|adoc)$/i;

function EntryIcon({ type, name }: { type: "file" | "dir"; name: string }) {
  if (type === "dir") return <Folder className="size-4 shrink-0 fill-accent/20 text-accent" />;
  if (TEXT_EXT.test(name)) return <FileText className="size-4 shrink-0 text-muted" />;
  return <FileCode2 className="size-4 shrink-0 text-muted" />;
}

export async function CodeBrowser({ project, path }: { project: Project; path: string }) {
  const snapshotId = project.currentSnapshotId;
  if (!snapshotId) {
    return <EmptyState title="No code uploaded yet">The source for this project hasn&apos;t been published.</EmptyState>;
  }

  const info = await safeStat(snapshotId, path);
  if (!info) notFound();

  if (info.type === "dir") {
    const readme = info.entries.find((e) => e.type === "file" && /^readme(\.md|\.markdown|\.txt)?$/i.test(e.name));
    const readmeFile = readme ? await readSnapshotFile(snapshotId, readme.path) : null;
    return (
      <div className="space-y-6">
        <div>
          <Breadcrumbs slug={project.slug} path={info.path} />
          <div className="card divide-y divide-border overflow-hidden">
            {info.path && (
              <Link
                href={
                  info.path.includes("/")
                    ? `/p/${project.slug}/tree/${encodePath(info.path.split("/").slice(0, -1).join("/"))}`
                    : `/p/${project.slug}`
                }
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted transition hover:bg-surface-2"
              >
                <CornerLeftUp className="size-4" />
                ..
              </Link>
            )}
            {info.entries.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">Empty folder</p>}
            {info.entries.map((entry) => (
              <Link
                key={entry.path}
                href={`/p/${project.slug}/tree/${encodePath(entry.path)}`}
                className="group flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-surface-2"
              >
                <EntryIcon type={entry.type} name={entry.name} />
                <span className="flex-1 truncate group-hover:text-accent">{entry.name}</span>
                {entry.type === "file" && <span className="text-xs text-muted tabular-nums">{formatBytes(entry.size)}</span>}
              </Link>
            ))}
          </div>
        </div>
        {readmeFile && !readmeFile.binary && !readmeFile.tooLarge && (
          <div className="card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-medium">
              <BookOpen className="size-4 text-accent" />
              {readme!.name}
            </div>
            <div className="p-6 sm:p-8">
              {/\.txt$/i.test(readme!.name) ? (
                <pre className="text-sm whitespace-pre-wrap">{readmeFile.text}</pre>
              ) : (
                <Markdown>{readmeFile.text}</Markdown>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const file = await readSnapshotFile(snapshotId, info.path);
  if (!file) notFound();
  const rawHref = `/p/${project.slug}/raw/${encodePath(file.path)}`;
  const suggestable = canSuggest(project) && !file.binary && !file.tooLarge;
  // A trailing newline would otherwise render as an extra empty line.
  const code = file.text.replace(/\r?\n$/, "");
  const html = !file.binary && !file.tooLarge ? await highlight(code, file.path) : null;
  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div>
      <Breadcrumbs slug={project.slug} path={file.path} />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/50 px-4 py-2.5">
          <span className="flex items-center gap-2 text-xs text-muted">
            <EntryIcon type="file" name={file.path} />
            {html ? `${lineCount} lines · ` : ""}
            {formatBytes(file.size)}
          </span>
          <div className="flex gap-2">
            {suggestable && (
              <Link
                href={`/p/${project.slug}/fix?path=${encodeURIComponent(file.path)}`}
                className="btn btn-primary btn-sm"
              >
                <GitPullRequestArrow className="size-3.5" />
                Suggest a fix
              </Link>
            )}
            <a href={rawHref} className="btn btn-sm">
              <FileDown className="size-3.5" />
              Raw
            </a>
          </div>
        </div>
        {html ? (
          <div className="code-view" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="px-4 py-12 text-center text-sm text-muted">
            {file.binary ? "Binary file not shown." : "File too large to display."}{" "}
            <a href={rawHref} className="link">
              Download it
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
