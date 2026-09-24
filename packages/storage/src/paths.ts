import path from "node:path";

export class UnsafePathError extends Error {
  constructor(p: string) {
    super(`Unsafe path: ${p}`);
    this.name = "UnsafePathError";
  }
}

/**
 * Normalises a user/archive supplied path to a clean, forward-slash, relative
 * path. Throws on anything that could escape its root ("..", absolute paths,
 * drive letters, NUL bytes). Returns "" for the root itself.
 */
export function normalizeRelativePath(input: string): string {
  if (input.includes("\0")) throw new UnsafePathError(input);
  const unified = input.replace(/\\/g, "/");
  if (unified.startsWith("/") || /^[a-zA-Z]:/.test(unified)) {
    throw new UnsafePathError(input);
  }
  const parts: string[] = [];
  for (const part of unified.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") throw new UnsafePathError(input);
    parts.push(part);
  }
  return parts.join("/");
}

/** Resolves `rel` under `root`, guaranteeing the result stays inside root. */
export function resolveInside(root: string, rel: string): string {
  const clean = normalizeRelativePath(rel);
  const resolvedRoot = path.resolve(root);
  const full = path.resolve(resolvedRoot, clean);
  if (full !== resolvedRoot && !full.startsWith(resolvedRoot + path.sep)) {
    throw new UnsafePathError(rel);
  }
  return full;
}

/** Validates ids used as directory/file names (uuids in practice). */
export function assertSafeId(id: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new UnsafePathError(id);
  return id;
}
