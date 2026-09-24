"use server";

import { applyPatch } from "diff";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  and,
  eq,
  FIX_STATUS,
  fixSuggestions,
  getDb,
  ISSUE_STATUS,
  issues,
  max,
  ne,
  projectMedia,
  projects,
  releaseAssets,
  releases,
  snapshots,
  VISIBILITY,
  type IssueStatus,
  type Visibility,
} from "@foundry/db";
import { deleteMedia, deleteReleaseAsset, deleteSnapshot, deriveSnapshot, readSnapshotFile } from "@foundry/storage";
import { requireAdmin } from "../auth";
import { parseEmbed } from "../embed";
import { slugify } from "../format";
import { FormError, handleForm, readString, type FormState } from "../forms";

function refreshAll() {
  revalidatePath("/", "layout");
}

function readProjectFields(fd: FormData) {
  const name = readString(fd, "name", { required: true, max: 100, label: "Name" });
  const slug = slugify(readString(fd, "slug", { max: 64 }) || name);
  if (!slug) throw new FormError("Slug must contain letters or numbers.");
  const description = readString(fd, "description", { max: 500 });
  const visibility = readString(fd, "visibility") as Visibility;
  if (!VISIBILITY.includes(visibility)) throw new FormError("Invalid visibility.");
  const acceptSuggestions = fd.get("acceptSuggestions") === "on";
  return { name, slug, description, visibility, acceptSuggestions };
}

function assertSlugFree(slug: string, exceptId?: string) {
  const clash = getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(exceptId ? and(eq(projects.slug, slug), ne(projects.id, exceptId)) : eq(projects.slug, slug))
    .get();
  if (clash) throw new FormError(`The slug "${slug}" is already used by another project.`);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function createProject(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  let id = "";
  const result = await handleForm(() => {
    const fields = readProjectFields(fd);
    assertSlugFree(fields.slug);
    id = getDb().insert(projects).values(fields).returning({ id: projects.id }).get().id;
    return { success: "created" };
  });
  if (!id) return result;
  refreshAll();
  redirect(`/admin/projects/${id}/code`);
}

export async function updateProject(projectId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  return handleForm(() => {
    const fields = readProjectFields(fd);
    assertSlugFree(fields.slug, projectId);
    getDb()
      .update(projects)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .run();
    refreshAll();
    return { success: "Project saved." };
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const snaps = db.select({ id: snapshots.id }).from(snapshots).where(eq(snapshots.projectId, projectId)).all();
  const assets = db
    .select({ id: releaseAssets.id })
    .from(releaseAssets)
    .innerJoin(releases, eq(releases.id, releaseAssets.releaseId))
    .where(eq(releases.projectId, projectId))
    .all();
  const media = db.select({ id: projectMedia.id }).from(projectMedia).where(eq(projectMedia.projectId, projectId)).all();
  db.delete(projects).where(eq(projects.id, projectId)).run();
  await Promise.all([
    ...snaps.map((s) => deleteSnapshot(s.id)),
    ...assets.map((a) => deleteReleaseAsset(a.id)),
    ...media.map((m) => deleteMedia(m.id)),
  ]);
  refreshAll();
  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Media gallery
// ---------------------------------------------------------------------------

function projectMediaItem(projectId: string, mediaId: string) {
  return getDb()
    .select()
    .from(projectMedia)
    .where(and(eq(projectMedia.id, mediaId), eq(projectMedia.projectId, projectId)))
    .get();
}

export async function addMediaEmbed(projectId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  return handleForm(() => {
    const embed = parseEmbed(readString(fd, "url", { required: true, max: 500, label: "Video link" }));
    if (!embed) throw new FormError("Paste a YouTube or Vimeo link.");
    const caption = readString(fd, "caption", { max: 300 });
    const db = getDb();
    const position =
      (db.select({ n: max(projectMedia.position) }).from(projectMedia).where(eq(projectMedia.projectId, projectId)).get()?.n ?? -1) + 1;
    db.insert(projectMedia).values({ projectId, kind: "embed", url: embed.embedUrl, caption, position }).run();
    refreshAll();
    return { success: "Video added." };
  });
}

export async function updateMediaCaption(projectId: string, mediaId: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const caption = readString(fd, "caption", { max: 300 });
  getDb()
    .update(projectMedia)
    .set({ caption })
    .where(and(eq(projectMedia.id, mediaId), eq(projectMedia.projectId, projectId)))
    .run();
  refreshAll();
}

export async function moveMedia(projectId: string, mediaId: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const list = db
    .select()
    .from(projectMedia)
    .where(eq(projectMedia.projectId, projectId))
    .orderBy(projectMedia.position, projectMedia.createdAt)
    .all();
  const i = list.findIndex((m) => m.id === mediaId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
  db.transaction((tx) => {
    list.forEach((m, position) => tx.update(projectMedia).set({ position }).where(eq(projectMedia.id, m.id)).run());
  });
  refreshAll();
}

export async function setProjectThumbnail(projectId: string, mediaId: string | null): Promise<void> {
  await requireAdmin();
  if (mediaId && projectMediaItem(projectId, mediaId)?.kind !== "image") return;
  getDb().update(projects).set({ thumbnailMediaId: mediaId }).where(eq(projects.id, projectId)).run();
  refreshAll();
}

export async function removeMedia(projectId: string, mediaId: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  if (!projectMediaItem(projectId, mediaId)) return;
  db.transaction((tx) => {
    tx.delete(projectMedia).where(eq(projectMedia.id, mediaId)).run();
    tx.update(projects)
      .set({ thumbnailMediaId: null })
      .where(and(eq(projects.id, projectId), eq(projects.thumbnailMediaId, mediaId)))
      .run();
  });
  await deleteMedia(mediaId);
  refreshAll();
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

export async function setCurrentSnapshot(projectId: string, snapshotId: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const snap = db
    .select()
    .from(snapshots)
    .where(and(eq(snapshots.id, snapshotId), eq(snapshots.projectId, projectId)))
    .get();
  if (!snap) return;
  db.update(projects).set({ currentSnapshotId: snap.id, updatedAt: new Date() }).where(eq(projects.id, projectId)).run();
  refreshAll();
}

export async function removeSnapshot(projectId: string, snapshotId: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project || project.currentSnapshotId === snapshotId) return;
  db.delete(snapshots)
    .where(and(eq(snapshots.id, snapshotId), eq(snapshots.projectId, projectId)))
    .run();
  await deleteSnapshot(snapshotId);
  refreshAll();
}

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

function readReleaseFields(fd: FormData) {
  const tag = readString(fd, "tag", { required: true, max: 64, label: "Tag" });
  if (!/^[\w.+-]+$/.test(tag)) throw new FormError("Tag may only contain letters, numbers, dots, dashes and underscores.");
  const title = readString(fd, "title", { max: 200 }) || tag;
  const notes = readString(fd, "notes", { max: 50_000 });
  return { tag, title, notes };
}

function assertTagFree(projectId: string, tag: string, exceptId?: string) {
  const clash = getDb()
    .select({ id: releases.id })
    .from(releases)
    .where(
      exceptId
        ? and(eq(releases.projectId, projectId), eq(releases.tag, tag), ne(releases.id, exceptId))
        : and(eq(releases.projectId, projectId), eq(releases.tag, tag)),
    )
    .get();
  if (clash) throw new FormError(`A release tagged "${tag}" already exists.`);
}

export async function createRelease(projectId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  let id = "";
  const result = await handleForm(() => {
    const fields = readReleaseFields(fd);
    assertTagFree(projectId, fields.tag);
    id = getDb()
      .insert(releases)
      .values({ projectId, ...fields })
      .returning({ id: releases.id })
      .get().id;
    return { success: "created" };
  });
  if (!id) return result;
  redirect(`/admin/projects/${projectId}/releases/${id}`);
}

export async function updateRelease(releaseId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  return handleForm(() => {
    const release = getDb().select().from(releases).where(eq(releases.id, releaseId)).get();
    if (!release) throw new FormError("Release not found.");
    const fields = readReleaseFields(fd);
    assertTagFree(release.projectId, fields.tag, releaseId);
    getDb().update(releases).set(fields).where(eq(releases.id, releaseId)).run();
    refreshAll();
    return { success: "Release saved." };
  });
}

export async function setReleasePublished(releaseId: string, published: boolean): Promise<void> {
  await requireAdmin();
  getDb()
    .update(releases)
    .set({ published, publishedAt: published ? new Date() : null })
    .where(eq(releases.id, releaseId))
    .run();
  refreshAll();
}

export async function deleteRelease(releaseId: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const release = db.select().from(releases).where(eq(releases.id, releaseId)).get();
  if (!release) return;
  const assets = db.select({ id: releaseAssets.id }).from(releaseAssets).where(eq(releaseAssets.releaseId, releaseId)).all();
  db.delete(releases).where(eq(releases.id, releaseId)).run();
  await Promise.all(assets.map((a) => deleteReleaseAsset(a.id)));
  refreshAll();
  redirect(`/admin/projects/${release.projectId}/releases`);
}

export async function removeReleaseAsset(assetId: string): Promise<void> {
  await requireAdmin();
  getDb().delete(releaseAssets).where(eq(releaseAssets.id, assetId)).run();
  await deleteReleaseAsset(assetId);
  refreshAll();
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export async function updateIssue(issueId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  return handleForm(() => {
    const status = readString(fd, "status") as IssueStatus;
    if (!ISSUE_STATUS.includes(status)) throw new FormError("Invalid status.");
    const isPublic = fd.get("isPublic") === "on";
    const adminNote = readString(fd, "adminNote", { max: 20_000 });
    getDb().update(issues).set({ status, isPublic, adminNote }).where(eq(issues.id, issueId)).run();
    refreshAll();
    return { success: "Issue updated." };
  });
}

export async function deleteIssue(issueId: string): Promise<void> {
  await requireAdmin();
  const issue = getDb().select().from(issues).where(eq(issues.id, issueId)).get();
  if (!issue) return;
  getDb().delete(issues).where(eq(issues.id, issueId)).run();
  refreshAll();
  redirect(`/admin/projects/${issue.projectId}/issues`);
}

// ---------------------------------------------------------------------------
// Fix suggestions
// ---------------------------------------------------------------------------

/**
 * Applies a suggested fix on top of the project's *current* code, producing a
 * new snapshot. If the file changed since the suggestion was made, the diff
 * is re-applied as a patch; conflicts are reported instead of overwriting.
 */
export async function applyFix(fixId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const result = await handleForm(async () => {
    const db = getDb();
    const fix = db.select().from(fixSuggestions).where(eq(fixSuggestions.id, fixId)).get();
    if (!fix || fix.status !== "pending") throw new FormError("This suggestion is no longer pending.");
    const project = db.select().from(projects).where(eq(projects.id, fix.projectId)).get();
    if (!project?.currentSnapshotId) throw new FormError("The project has no code.");

    let content = fix.proposedContent;
    if (project.currentSnapshotId !== fix.baseSnapshotId) {
      const current = await readSnapshotFile(project.currentSnapshotId, fix.filePath);
      if (!current || current.binary || current.tooLarge) {
        throw new FormError(`${fix.filePath} no longer exists in the current code.`);
      }
      const patched = applyPatch(current.text, fix.diff);
      if (patched === false) {
        throw new FormError("The file changed since this fix was suggested and the diff no longer applies cleanly.");
      }
      content = patched;
    }

    const note = readString(fd, "adminNote", { max: 20_000 });
    const snap = db
      .insert(snapshots)
      .values({ projectId: project.id, message: `Apply fix: ${fix.title} (suggested by ${fix.authorName})` })
      .returning()
      .get();
    const stats = await deriveSnapshot(project.currentSnapshotId, snap.id, [
      { path: fix.filePath, data: new TextEncoder().encode(content) },
    ]);
    db.transaction((tx) => {
      tx.update(snapshots).set(stats).where(eq(snapshots.id, snap.id)).run();
      tx.update(projects).set({ currentSnapshotId: snap.id, updatedAt: new Date() }).where(eq(projects.id, project.id)).run();
      tx.update(fixSuggestions)
        .set({ status: "applied", appliedSnapshotId: snap.id, adminNote: note })
        .where(eq(fixSuggestions.id, fix.id))
        .run();
    });
    refreshAll();
    return { success: "Fix applied — a new code snapshot is now live." };
  });
  return result;
}

export async function setFixStatus(fixId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  return handleForm(() => {
    const status = readString(fd, "status");
    if (status !== "rejected" && status !== "pending") throw new FormError("Invalid status.");
    if (!FIX_STATUS.includes(status)) throw new FormError("Invalid status.");
    const adminNote = readString(fd, "adminNote", { max: 20_000 });
    getDb().update(fixSuggestions).set({ status, adminNote }).where(eq(fixSuggestions.id, fixId)).run();
    refreshAll();
    return { success: status === "rejected" ? "Suggestion rejected." : "Suggestion reopened." };
  });
}

export async function deleteFix(fixId: string): Promise<void> {
  await requireAdmin();
  const fix = getDb().select().from(fixSuggestions).where(eq(fixSuggestions.id, fixId)).get();
  if (!fix) return;
  getDb().delete(fixSuggestions).where(eq(fixSuggestions.id, fixId)).run();
  refreshAll();
  redirect(`/admin/projects/${fix.projectId}/fixes`);
}
