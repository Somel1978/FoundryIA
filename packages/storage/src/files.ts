/** Heuristic: a NUL byte in the first 8KB means binary (same as git). */
export function isBinary(data: Uint8Array): boolean {
  const len = Math.min(data.length, 8000);
  for (let i = 0; i < len; i++) if (data[i] === 0) return true;
  return false;
}

/** Entries skipped when importing an archive. */
const IGNORED_SEGMENTS = new Set([".git", "node_modules", "__MACOSX", ".DS_Store", ".turbo", ".next"]);

export function isIgnoredPath(relPath: string): boolean {
  return relPath.split("/").some((seg) => IGNORED_SEGMENTS.has(seg));
}

const CONTENT_TYPES: Record<string, string> = {
  zip: "application/zip",
  gz: "application/gzip",
  tgz: "application/gzip",
  tar: "application/x-tar",
  json: "application/json",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  pdf: "application/pdf",
  exe: "application/vnd.microsoft.portable-executable",
  dmg: "application/x-apple-diskimage",
  deb: "application/vnd.debian.binary-package",
  apk: "application/vnd.android.package-archive",
  wasm: "application/wasm",
};

export function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}
