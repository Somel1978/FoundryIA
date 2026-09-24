import "server-only";
import { asc, eq, getDb, projectMedia } from "@foundry/db";
import type { GalleryItem } from "@/components/media-gallery";
import { parseEmbed } from "./embed";

export function listProjectMedia(projectId: string) {
  return getDb()
    .select()
    .from(projectMedia)
    .where(eq(projectMedia.projectId, projectId))
    .orderBy(asc(projectMedia.position), asc(projectMedia.createdAt))
    .all();
}

export function galleryItems(projectId: string): GalleryItem[] {
  return listProjectMedia(projectId).map((m) => {
    if (m.kind === "embed") {
      return { id: m.id, kind: "embed", caption: m.caption, src: m.url, thumb: parseEmbed(m.url)?.thumbnailUrl ?? null };
    }
    const src = `/media/${m.id}`;
    return { id: m.id, kind: m.kind, caption: m.caption, src, thumb: m.kind === "image" ? src : null };
  });
}
