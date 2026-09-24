import { createReadStream, existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { unzipSync, zipSync, type Zippable } from "fflate";
import { dataDir } from "@foundry/env";
import { isBinary, isIgnoredPath } from "./files";
import { assertSafeId, normalizeRelativePath, resolveInside } from "./paths";

export { guessContentType, isBinary } from "./files";
export { normalizeRelativePath, UnsafePathError } from "./paths";

export const LIMITS = {
  maxFiles: 20_000,
  maxSnapshotBytes: 250 * 1024 * 1024,
  maxViewableFileBytes: 1024 * 1024,
};

export class StorageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageLimitError";
  }
}

const snapshotsRoot = () => path.join(dataDir(), "snapshots");
const releasesRoot = () => path.join(dataDir(), "releases");

export function snapshotDir(snapshotId: string): string {
  return path.join(snapshotsRoot(), assertSafeId(snapshotId));
}

export interface InputFile {
  path: string;
  data: Uint8Array;
}

export interface WriteResult {
  fileCount: number;
  totalBytes: number;
}

/**
 * If every file sits under one top-level folder (typical for "Download ZIP"
 * archives, e.g. `my-repo-main/...`), drop that folder.
 */
function stripCommonRoot(files: InputFile[]): InputFile[] {
  if (files.length === 0) return files;
  const first = files[0]!.path.split("/");
  if (first.length < 2) return files;
  const root = first[0]!;
  if (!files.every((f) => f.path.startsWith(root + "/"))) return files;
  return files.map((f) => ({ ...f, path: f.path.slice(root.length + 1) }));
}

/** Writes a full source tree into a (new) snapshot directory. */
export async function writeSnapshot(snapshotId: string, input: InputFile[]): Promise<WriteResult> {
  const files = stripCommonRoot(
    input
      .map((f) => ({ ...f, path: normalizeRelativePath(f.path) }))
      .filter((f) => f.path !== "" && !isIgnoredPath(f.path)),
  );
  if (files.length > LIMITS.maxFiles) {
    throw new StorageLimitError(`Too many files (${files.length} > ${LIMITS.maxFiles})`);
  }
  const totalBytes = files.reduce((sum, f) => sum + f.data.byteLength, 0);
  if (totalBytes > LIMITS.maxSnapshotBytes) {
    throw new StorageLimitError("Upload exceeds the maximum snapshot size");
  }

  const root = snapshotDir(snapshotId);
  await mkdir(root, { recursive: true });
  for (const file of files) {
    const target = resolveInside(root, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.data);
  }
  return { fileCount: files.length, totalBytes };
}

/** Extracts a zip archive into a snapshot. */
export async function writeSnapshotFromZip(snapshotId: string, zip: Uint8Array): Promise<WriteResult> {
  let entryCount = 0;
  let declaredBytes = 0;
  const entries = unzipSync(zip, {
    filter: (entry) => {
      // Guard against zip bombs before inflating.
      entryCount++;
      declaredBytes += entry.originalSize;
      if (entryCount > LIMITS.maxFiles * 2 || declaredBytes > LIMITS.maxSnapshotBytes * 2) {
        throw new StorageLimitError("Archive is too large");
      }
      return !entry.name.endsWith("/");
    },
  });
  return writeSnapshot(
    snapshotId,
    Object.entries(entries).map(([p, data]) => ({ path: p, data })),
  );
}

/** Creates a new snapshot as a copy of another one with some files replaced. */
export async function deriveSnapshot(
  fromSnapshotId: string,
  toSnapshotId: string,
  changes: InputFile[],
): Promise<WriteResult> {
  const from = snapshotDir(fromSnapshotId);
  const to = snapshotDir(toSnapshotId);
  if (existsSync(from)) await cp(from, to, { recursive: true });
  else await mkdir(to, { recursive: true });
  for (const change of changes) {
    const target = resolveInside(to, change.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, change.data);
  }
  return snapshotStats(toSnapshotId);
}

async function walk(root: string, rel = ""): Promise<string[]> {
  const out: string[] = [];
  const dir = rel ? path.join(root, rel) : root;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(root, childRel)));
    else if (entry.isFile()) out.push(childRel);
  }
  return out;
}

export async function listAllFiles(snapshotId: string): Promise<string[]> {
  const root = snapshotDir(snapshotId);
  if (!existsSync(root)) return [];
  return (await walk(root)).sort();
}

export async function snapshotStats(snapshotId: string): Promise<WriteResult> {
  const root = snapshotDir(snapshotId);
  const files = await listAllFiles(snapshotId);
  let totalBytes = 0;
  for (const f of files) totalBytes += (await stat(path.join(root, f))).size;
  return { fileCount: files.length, totalBytes };
}

export interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
}

export type PathInfo =
  | { type: "dir"; path: string; entries: TreeEntry[] }
  | { type: "file"; path: string; size: number }
  | null;

/** Describes what lives at `relPath` within a snapshot. */
export async function statPath(snapshotId: string, relPath: string): Promise<PathInfo> {
  const root = snapshotDir(snapshotId);
  const clean = normalizeRelativePath(relPath);
  const full = resolveInside(root, clean);
  if (!existsSync(full)) return null;
  const s = await stat(full);
  if (s.isFile()) return { type: "file", path: clean, size: s.size };
  if (!s.isDirectory()) return null;

  const entries: TreeEntry[] = [];
  for (const entry of await readdir(full, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isFile()) continue;
    const childPath = clean ? `${clean}/${entry.name}` : entry.name;
    const size = entry.isFile() ? (await stat(path.join(full, entry.name))).size : 0;
    entries.push({ name: entry.name, path: childPath, type: entry.isDirectory() ? "dir" : "file", size });
  }
  entries.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
  return { type: "dir", path: clean, entries };
}

export interface FileContent {
  path: string;
  size: number;
  binary: boolean;
  tooLarge: boolean;
  /** UTF-8 text; empty when binary or too large to display. */
  text: string;
}

export async function readSnapshotFile(snapshotId: string, relPath: string): Promise<FileContent | null> {
  const info = await statPath(snapshotId, relPath);
  if (!info || info.type !== "file") return null;
  const full = resolveInside(snapshotDir(snapshotId), info.path);
  if (info.size > LIMITS.maxViewableFileBytes) {
    return { path: info.path, size: info.size, binary: false, tooLarge: true, text: "" };
  }
  const data = await readFile(full);
  const binary = isBinary(data);
  return { path: info.path, size: info.size, binary, tooLarge: false, text: binary ? "" : data.toString("utf8") };
}

export async function readSnapshotFileRaw(snapshotId: string, relPath: string): Promise<Buffer | null> {
  const info = await statPath(snapshotId, relPath);
  if (!info || info.type !== "file") return null;
  return readFile(resolveInside(snapshotDir(snapshotId), info.path));
}

/** Bundles a snapshot into a zip, nested under `rootFolder/`. */
export async function zipSnapshot(snapshotId: string, rootFolder: string): Promise<Uint8Array> {
  const root = snapshotDir(snapshotId);
  const tree: Zippable = {};
  for (const rel of await listAllFiles(snapshotId)) {
    tree[`${rootFolder}/${rel}`] = new Uint8Array(await readFile(path.join(root, rel)));
  }
  return zipSync(tree, { level: 6 });
}

export async function deleteSnapshot(snapshotId: string): Promise<void> {
  await rm(snapshotDir(snapshotId), { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Release assets
// ---------------------------------------------------------------------------

function releaseAssetPath(assetId: string): string {
  return path.join(releasesRoot(), assertSafeId(assetId));
}

export async function saveReleaseAsset(assetId: string, data: Uint8Array): Promise<void> {
  await mkdir(releasesRoot(), { recursive: true });
  await writeFile(releaseAssetPath(assetId), data);
}

export function releaseAssetWebStream(assetId: string): ReadableStream<Uint8Array> | null {
  const p = releaseAssetPath(assetId);
  if (!existsSync(p)) return null;
  return Readable.toWeb(createReadStream(p)) as ReadableStream<Uint8Array>;
}

export async function deleteReleaseAsset(assetId: string): Promise<void> {
  await rm(releaseAssetPath(assetId), { force: true });
}
