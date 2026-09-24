import path from "node:path";
import { revalidatePath } from "next/cache";
import { eq, getDb, releaseAssets, releases } from "@foundry/db";
import { guessContentType, saveReleaseAsset } from "@foundry/storage";
import { isAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/config";

export async function POST(request: Request, ctx: RouteContext<"/api/admin/releases/[id]/assets">) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) {
    return Response.json({ error: `Upload exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` }, { status: 413 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const release = db.select().from(releases).where(eq(releases.id, id)).get();
  if (!release) return Response.json({ error: "Release not found" }, { status: 404 });

  const files = (await request.formData()).getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return Response.json({ error: "Choose at least one file." }, { status: 400 });

  for (const file of files) {
    const filename = path.basename(file.name.replace(/\\/g, "/")).slice(0, 255) || "file";
    const asset = db
      .insert(releaseAssets)
      .values({
        releaseId: release.id,
        filename,
        contentType: guessContentType(filename),
        size: file.size,
      })
      .returning()
      .get();
    await saveReleaseAsset(asset.id, new Uint8Array(await file.arrayBuffer()));
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true, count: files.length });
}
