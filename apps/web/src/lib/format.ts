export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Encodes a repo-relative path for use in a URL, keeping the slashes. */
export function encodePath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}

/** Decodes catch-all route segments; malformed escapes yield null (→ 404). */
export function decodeSegments(segments: string[]): string | null {
  try {
    return segments.map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}

/** 950 → "950", 1234 → "1.2k", 2500000 → "2.5M". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function downloadsLabel(n: number): string {
  return `${formatCount(n)} download${n === 1 ? "" : "s"}`;
}
