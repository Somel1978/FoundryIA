import { isBinary, readSnapshotFileRaw, UnsafePathError } from "@foundry/storage";
import { decodeSegments } from "@/lib/format";
import { findViewableProject } from "@/lib/projects";

export async function GET(_req: Request, ctx: RouteContext<"/p/[slug]/raw/[...path]">) {
  const { slug, path } = await ctx.params;
  const project = await findViewableProject(slug);
  if (!project?.currentSnapshotId) return new Response("Not found", { status: 404 });

  const relPath = decodeSegments(path);
  if (relPath === null) return new Response("Not found", { status: 404 });
  let data: Buffer | null;
  try {
    data = await readSnapshotFileRaw(project.currentSnapshotId, relPath);
  } catch (err) {
    if (err instanceof UnsafePathError) return new Response("Not found", { status: 404 });
    throw err;
  }
  if (!data) return new Response("Not found", { status: 404 });

  const filename = relPath.split("/").pop() ?? "file";
  const binary = isBinary(data);
  // Never serve uploaded content as HTML: text is always text/plain.
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": binary ? "application/octet-stream" : "text/plain; charset=utf-8",
      "Content-Disposition": `${binary ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
