import { eq, getDb, projectMedia } from "@foundry/db";
import { mediaSize, mediaStream } from "@foundry/storage";
import { isAdmin } from "@/lib/auth";

/** Serves gallery images/videos, with HTTP Range support so videos can seek. */
export async function GET(request: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  const media = getDb().query.projectMedia.findFirst({
    where: eq(projectMedia.id, id),
    with: { project: { columns: { visibility: true } } },
  }).sync();
  if (!media || media.kind === "embed") return new Response("Not found", { status: 404 });

  const isPublic = media.project.visibility === "public";
  if (!isPublic && !(await isAdmin())) return new Response("Not found", { status: 404 });

  const size = mediaSize(media.id);
  if (size === null) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": media.contentType,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
  };

  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start: number;
    let end: number;
    if (range[1]) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    } else {
      start = Math.max(size - Number(range[2]), 0); // suffix range: last N bytes
      end = size - 1;
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(mediaStream(media.id, { start, end }), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(mediaStream(media.id), { headers: { ...headers, "Content-Length": String(size) } });
}
