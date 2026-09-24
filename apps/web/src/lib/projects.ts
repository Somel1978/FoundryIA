import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { desc, eq, getDb, projects, type Project } from "@foundry/db";
import { isAdmin } from "./auth";

/**
 * Loads a project for the public site. Private projects are hidden from
 * visitors but stay viewable by the admin (handy as a preview).
 */
export const findViewableProject = cache(async (slug: string): Promise<Project | null> => {
  const project = getDb().select().from(projects).where(eq(projects.slug, slug)).get();
  if (!project) return null;
  if (project.visibility !== "public" && !(await isAdmin())) return null;
  return project;
});

export async function getViewableProject(slug: string): Promise<Project> {
  const project = await findViewableProject(slug);
  if (!project) notFound();
  return project;
}

export function listPublicProjects(): Project[] {
  return getDb()
    .select()
    .from(projects)
    .where(eq(projects.visibility, "public"))
    .orderBy(desc(projects.updatedAt))
    .all();
}

export function getProjectById(id: string): Project {
  const project = getDb().select().from(projects).where(eq(projects.id, id)).get();
  if (!project) notFound();
  return project;
}

/** Visitors may open issues / propose fixes only on public projects that allow it. */
export function canSuggest(project: Project): boolean {
  return project.visibility === "public" && project.acceptSuggestions;
}
