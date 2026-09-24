import { revalidatePath } from "next/cache";
import { eq, getDb, max, projectMedia, projects } from "@foundry/db";
import { saveMedia, sniffMedia } from "@foundry/storage";
import { isAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/config";

/** Uploads images/videos to a project's gallery. */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/projects/[id]/media">) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) {
    return Response.json({ error: `Upload exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` }, { status: 413 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const project = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const files = (await request.formData()).getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return Response.json({ error: "Choose at least one image or video." }, { status: 400 });

  // Validate everything before storing anything.
  const items: { file: File; data: Uint8Array; kind: "image" | "video"; contentType: string }[] = [];
  for (const file of files) {
    const data = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffMedia(data);
    if (!sniffed) {
      return Response.json(
        { error: `${file.name}: unsupported format. Use JPG, PNG, GIF, WebP, AVIF, MP4, WebM or MOV.` },
        { status: 400 },
      );
    }
    items.push({ file, data, ...sniffed });
  }

  let position = (db.select({ n: max(projectMedia.position) }).from(projectMedia).where(eq(projectMedia.projectId, id)).get()?.n ?? -1) + 1;
  let thumbnail = project.thumbnailMediaId;
  for (const item of items) {
    const row = db
      .insert(projectMedia)
      .values({
        projectId: id,
        kind: item.kind,
        filename: item.file.name.slice(0, 255),
        contentType: item.contentType,
        size: item.data.byteLength,
        position: position++,
      })
      .returning()
      .get();
    await saveMedia(row.id, item.data);
    // The first image becomes the thumbnail automatically.
    if (!thumbnail && item.kind === "image") thumbnail = row.id;
  }
  db.update(projects).set({ thumbnailMediaId: thumbnail, updatedAt: new Date() }).where(eq(projects.id, id)).run();
  revalidatePath("/", "layout");
  return Response.json({ ok: true, count: items.length });
}
