"use server";

import { createTwoFilesPatch } from "diff";
import { redirect } from "next/navigation";
import { and, eq, fixSuggestions, getDb, issues, max, snapshots } from "@foundry/db";
import { readSnapshotFile, UnsafePathError } from "@foundry/storage";
import { FormError, handleForm, isSpam, readEmail, readRaw, readString, type FormState } from "../forms";
import { canSuggest, findViewableProject } from "../projects";

async function suggestableProject(slug: string) {
  const project = await findViewableProject(slug);
  if (!project || !canSuggest(project)) throw new FormError("This project is not accepting suggestions.");
  return project;
}

export async function submitIssue(slug: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return handleForm(async () => {
    const project = await suggestableProject(slug);
    const title = readString(fd, "title", { required: true, max: 200, label: "Title" });
    const body = readString(fd, "body", { required: true, max: 20_000, label: "Description" });
    const authorName = readString(fd, "authorName", { required: true, max: 100, label: "Name" });
    const authorEmail = readEmail(fd, "authorEmail");

    if (!isSpam(fd)) {
      const db = getDb();
      db.transaction((tx) => {
        const last = tx.select({ n: max(issues.number) }).from(issues).where(eq(issues.projectId, project.id)).get();
        tx.insert(issues)
          .values({ projectId: project.id, number: (last?.n ?? 0) + 1, title, body, authorName, authorEmail })
          .run();
      });
    }
    return { success: "Thanks! Your issue was submitted and will appear here once it's been reviewed." };
  });
}

const MAX_FILE_CHARS = 1_000_000;

export async function submitFix(slug: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const result = await handleForm(async () => {
    const project = await suggestableProject(slug);
    const filePath = readString(fd, "filePath", { required: true, max: 1000 });
    const baseSnapshotId = readString(fd, "baseSnapshotId", { required: true, max: 64 });
    const title = readString(fd, "title", { required: true, max: 200, label: "Title" });
    const description = readString(fd, "description", { max: 20_000 });
    const authorName = readString(fd, "authorName", { required: true, max: 100, label: "Name" });
    const authorEmail = readEmail(fd, "authorEmail");
    const proposed = readRaw(fd, "content", MAX_FILE_CHARS).replace(/\r\n/g, "\n");

    const db = getDb();
    const snapshot = db
      .select()
      .from(snapshots)
      .where(and(eq(snapshots.id, baseSnapshotId), eq(snapshots.projectId, project.id)))
      .get();
    if (!snapshot) throw new FormError("The code you edited no longer exists. Please reload and try again.");

    let original;
    try {
      original = await readSnapshotFile(snapshot.id, filePath);
    } catch (err) {
      if (err instanceof UnsafePathError) throw new FormError("Invalid file path.");
      throw err;
    }
    if (!original || original.binary || original.tooLarge) throw new FormError("This file can't be edited.");
    if (original.text === proposed) throw new FormError("You haven't changed anything yet.");

    const diff = createTwoFilesPatch(`a/${filePath}`, `b/${filePath}`, original.text, proposed, undefined, undefined, {
      context: 3,
    });

    if (!isSpam(fd)) {
      db.insert(fixSuggestions)
        .values({
          projectId: project.id,
          baseSnapshotId: snapshot.id,
          filePath,
          title,
          description,
          proposedContent: proposed,
          diff,
          authorName,
          authorEmail,
        })
        .run();
    }
    return { success: "ok" };
  });
  if (result?.success) redirect(`/p/${slug}/fix/thanks`);
  return result;
}
