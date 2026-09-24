import Link from "next/link";
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
      <Link href={`/p/${slug}`} className="link font-semibold">
        {slug}
      </Link>
      {parts.map((part, i) => {
        const sub = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={sub} className="flex items-center gap-1">
            <span className="text-zinc-400">/</span>
            {last ? (
              <span>{part}</span>
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

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 fill-sky-500" aria-hidden>
      <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 fill-zinc-400" aria-hidden>
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
    </svg>
  );
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
          <div className="card divide-y divide-zinc-200 overflow-hidden dark:divide-zinc-800">
            {info.path && (
              <Link
                href={
                  info.path.includes("/")
                    ? `/p/${project.slug}/tree/${encodePath(info.path.split("/").slice(0, -1).join("/"))}`
                    : `/p/${project.slug}`
                }
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <span className="w-4" />
                ..
              </Link>
            )}
            {info.entries.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">Empty folder</p>}
            {info.entries.map((entry) => (
              <Link
                key={entry.path}
                href={`/p/${project.slug}/tree/${encodePath(entry.path)}`}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                {entry.type === "dir" ? <FolderIcon /> : <FileIcon />}
                <span className="flex-1 truncate">{entry.name}</span>
                {entry.type === "file" && <span className="text-xs text-zinc-500">{formatBytes(entry.size)}</span>}
              </Link>
            ))}
          </div>
        </div>
        {readmeFile && !readmeFile.binary && !readmeFile.tooLarge && (
          <div className="card">
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800">
              {readme!.name}
            </div>
            <div className="p-6">
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">
            {html ? `${lineCount} lines · ` : ""}
            {formatBytes(file.size)}
          </span>
          <div className="flex gap-2">
            {suggestable && (
              <Link href={`/p/${project.slug}/fix?path=${encodeURIComponent(file.path)}`} className="btn btn-primary">
                Suggest a fix
              </Link>
            )}
            <a href={rawHref} className="btn">
              Raw
            </a>
          </div>
        </div>
        {html ? (
          <div className="code-view" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
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
