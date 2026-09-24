import { zipSnapshot } from "@foundry/storage";
import { findViewableProject } from "@/lib/projects";

export async function GET(_req: Request, ctx: RouteContext<"/p/[slug]/archive">) {
  const { slug } = await ctx.params;
  const project = await findViewableProject(slug);
  if (!project?.currentSnapshotId) return new Response("Not found", { status: 404 });

  const zip = await zipSnapshot(project.currentSnapshotId, project.slug);
  return new Response(zip as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.slug}.zip"`,
    },
  });
}
