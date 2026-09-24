import { eq, getDb, releaseAssets, sql } from "@foundry/db";
import { releaseAssetWebStream } from "@foundry/storage";
import { isAdmin } from "@/lib/auth";

export async function GET(_req: Request, ctx: RouteContext<"/downloads/[assetId]">) {
  const { assetId } = await ctx.params;
  const db = getDb();
  const asset = db.query.releaseAssets.findFirst({
    where: eq(releaseAssets.id, assetId),
    with: { release: { with: { project: true } } },
  }).sync();
  if (!asset) return new Response("Not found", { status: 404 });

  const visible = asset.release.published && asset.release.project.visibility === "public";
  const admin = await isAdmin();
  if (!visible && !admin) return new Response("Not found", { status: 404 });

  const stream = releaseAssetWebStream(asset.id);
  if (!stream) return new Response("File missing", { status: 404 });

  if (!admin) {
    db.update(releaseAssets)
      .set({ downloadCount: sql`${releaseAssets.downloadCount} + 1` })
      .where(eq(releaseAssets.id, asset.id))
      .run();
  }

  return new Response(stream, {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Length": String(asset.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
