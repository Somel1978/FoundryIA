import { revalidatePath } from "next/cache";
import { eq, getDb, projects, snapshots } from "@foundry/db";
import {
  deleteSnapshot,
  StorageLimitError,
  UnsafePathError,
  writeSnapshot,
  writeSnapshotFromZip,
  type InputFile,
} from "@foundry/storage";
import { isAdmin } from "@/lib/auth";

/**
 * Uploads a new code snapshot, either as a single .zip (`archive`) or as a
 * folder of files (`files` + parallel `paths` with each file's relative path).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/projects/[id]/snapshots">) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const project = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const fd = await request.formData();
  const message = String(fd.get("message") ?? "").trim().slice(0, 500) || "Code upload";
  const makeCurrent = fd.get("makeCurrent") !== "false";
  const archive = fd.get("archive");
  const files = fd.getAll("files").filter((f): f is File => f instanceof File);
  const paths = fd.getAll("paths").map(String);

  if (!(archive instanceof File && archive.size > 0) && files.length === 0) {
    return Response.json({ error: "Choose a .zip file or a folder to upload." }, { status: 400 });
  }

  const snap = db.insert(snapshots).values({ projectId: project.id, message }).returning().get();
  try {
    let stats;
    if (archive instanceof File && archive.size > 0) {
      stats = await writeSnapshotFromZip(snap.id, new Uint8Array(await archive.arrayBuffer()));
    } else {
      const input: InputFile[] = [];
      for (const [i, file] of files.entries()) {
        input.push({ path: paths[i] || file.name, data: new Uint8Array(await file.arrayBuffer()) });
      }
      stats = await writeSnapshot(snap.id, input);
    }
    if (stats.fileCount === 0) throw new StorageLimitError("The upload contained no files.");

    db.update(snapshots).set(stats).where(eq(snapshots.id, snap.id)).run();
    if (makeCurrent) {
      db.update(projects)
        .set({ currentSnapshotId: snap.id, updatedAt: new Date() })
        .where(eq(projects.id, project.id))
        .run();
    }
    revalidatePath("/", "layout");
    return Response.json({ ok: true, snapshotId: snap.id, ...stats });
  } catch (err) {
    db.delete(snapshots).where(eq(snapshots.id, snap.id)).run();
    await deleteSnapshot(snap.id);
    if (err instanceof StorageLimitError || err instanceof UnsafePathError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Could not read the upload. Is it a valid .zip?" }, { status: 400 });
  }
}
