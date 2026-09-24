"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

function tooLarge(files: File[], maxBytes: number): string | null {
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= maxBytes) return null;
  const mb = (n: number) => `${Math.ceil(n / 1024 / 1024)} MB`;
  return `This upload is ${mb(total)}; the limit is ${mb(maxBytes)} (Cloudflare caps request size).`;
}

async function send(url: string, fd: FormData): Promise<string | null> {
  const res = await fetch(url, { method: "POST", body: fd });
  if (res.ok) return null;
  if (res.status === 413) return "Upload too large for the server or Cloudflare limit.";
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? `Upload failed (${res.status})`;
}

function Status({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (success) return <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>;
  return null;
}

/** Upload a project's source as a .zip or by picking a local folder. */
export function CodeUploader({ projectId, maxBytes }: { projectId: string; maxBytes: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"zip" | "folder">("zip");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fd = new FormData();
    fd.set("message", (form.elements.namedItem("message") as HTMLInputElement).value);
    fd.set("makeCurrent", (form.elements.namedItem("makeCurrent") as HTMLInputElement).checked ? "true" : "false");
    if (mode === "zip") {
      const file = (form.elements.namedItem("archive") as HTMLInputElement).files?.[0];
      if (!file) return setError("Choose a .zip file.");
      const big = tooLarge([file], maxBytes);
      if (big) return setError(big);
      fd.set("archive", file);
    } else {
      const files = Array.from((form.elements.namedItem("folder") as HTMLInputElement).files ?? []);
      if (files.length === 0) return setError("Choose a folder.");
      const big = tooLarge(files, maxBytes);
      if (big) return setError(big);
      for (const f of files) {
        fd.append("files", f);
        fd.append("paths", f.webkitRelativePath || f.name);
      }
    }
    setBusy(true);
    const err = await send(`/api/admin/projects/${projectId}/snapshots`, fd);
    setBusy(false);
    if (err) return setError(err);
    formRef.current?.reset();
    setSuccess("Upload complete.");
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
        {(["zip", "folder"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1 ${mode === m ? "bg-surface-2 font-medium" : "text-muted"}`}
          >
            {m === "zip" ? ".zip archive" : "Folder"}
          </button>
        ))}
      </div>
      {mode === "zip" ? (
        <div>
          <input name="archive" type="file" accept=".zip,application/zip" className="input" />
          <p className="hint">A single top-level folder (like GitHub&apos;s “Download ZIP”) is stripped automatically.</p>
        </div>
      ) : (
        <div>
          <input
            name="folder"
            type="file"
            className="input"
            multiple
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          />
          <p className="hint">.git, node_modules and build folders are skipped.</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="message">Description</label>
        <input id="message" name="message" className="input" placeholder="e.g. v1.2 sources" maxLength={500} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="makeCurrent" defaultChecked /> Make this the live version
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Uploading…" : "Upload code"}
        </button>
        <Status error={error} success={success} />
      </div>
    </form>
  );
}

export function AssetUploader({ releaseId, maxBytes }: { releaseId: string; maxBytes: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const input = e.currentTarget.elements.namedItem("files") as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return setError("Choose at least one file.");
    const big = tooLarge(files, maxBytes);
    if (big) return setError(big);
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    setBusy(true);
    const err = await send(`/api/admin/releases/${releaseId}/assets`, fd);
    setBusy(false);
    if (err) return setError(err);
    formRef.current?.reset();
    setSuccess(`${files.length} file(s) uploaded.`);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
      <input name="files" type="file" multiple className="input max-w-md" />
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Uploading…" : "Upload"}
      </button>
      <Status error={error} success={success} />
    </form>
  );
}

/** Drag & drop (or click) upload of gallery images and videos. */
export function MediaUploader({ projectId, maxBytes }: { projectId: string; maxBytes: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function upload(files: File[]) {
    setError(null);
    setSuccess(null);
    if (files.length === 0) return;
    const big = tooLarge(files, maxBytes);
    if (big) return setError(big);
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    setBusy(true);
    const err = await send(`/api/admin/projects/${projectId}/media`, fd);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (err) return setError(err);
    setSuccess(`${files.length} file(s) added.`);
    router.refresh();
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-surface-2"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <ImagePlus className="mb-2 size-7 text-accent" />
        <span className="text-sm font-medium">{busy ? "Uploading…" : "Drop images or videos here, or click to choose"}</span>
        <span className="mt-1 text-xs text-muted">JPG, PNG, GIF, WebP, AVIF · MP4, WebM, MOV</span>
        <input
          ref={inputRef}
          name="media"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime,video/ogg"
          className="sr-only"
          onChange={(e) => void upload(Array.from(e.currentTarget.files ?? []))}
        />
      </label>
      <div className="mt-2 min-h-5">
        <Status error={error} success={success} />
      </div>
    </div>
  );
}
