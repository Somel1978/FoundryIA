import path from "node:path";
import { revalidatePath } from "next/cache";
import { eq, getDb, releaseAssets, releases } from "@foundry/db";
import { guessContentType, saveReleaseAsset } from "@foundry/storage";
import { isAdmin } from "@/lib/auth";

const MAX_ASSET_BYTES = 1024 * 1024 * 1024; // 1 GB

export async function POST(request: Request, ctx: RouteContext<"/api/admin/releases/[id]/assets">) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const release = db.select().from(releases).where(eq(releases.id, id)).get();
  if (!release) return Response.json({ error: "Release not found" }, { status: 404 });

  const files = (await request.formData()).getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return Response.json({ error: "Choose at least one file." }, { status: 400 });

  for (const file of files) {
    if (file.size > MAX_ASSET_BYTES) {
      return Response.json({ error: `${file.name} is larger than 1 GB.` }, { status: 400 });
    }
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
