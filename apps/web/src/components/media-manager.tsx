import { ArrowDown, ArrowUp, Film, Play, Star, Trash2, Clapperboard } from "lucide-react";
import type { ProjectMedia } from "@foundry/db";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/action-form";
import { addMediaEmbed, moveMedia, removeMedia, setProjectThumbnail, updateMediaCaption } from "@/lib/actions/admin";
import { MAX_UPLOAD_BYTES } from "@/lib/config";
import { parseEmbed } from "@/lib/embed";
import { formatBytes } from "@/lib/format";
import { SafeImg } from "./safe-img";
import { Badge } from "./ui";
import { MediaUploader } from "./uploaders";

function Preview({ item }: { item: ProjectMedia }) {
  if (item.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/media/${item.id}`} alt={item.caption} className="size-full object-cover" loading="lazy" />;
  }
  if (item.kind === "video") {
    return (
      <>
        <video src={`/media/${item.id}#t=0.5`} preload="metadata" muted className="size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
          <Play className="size-6 fill-white" />
        </span>
      </>
    );
  }
  const thumb = parseEmbed(item.url)?.thumbnailUrl;
  return (
    <>
      <div className="grid size-full place-items-center bg-surface-2 text-muted">
        <Film className="size-8" />
      </div>
      {thumb && <SafeImg src={thumb} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />}
      <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
        <Play className="size-6 fill-white" />
      </span>
    </>
  );
}

/** Admin gallery editor: upload, embed, caption, reorder, pick thumbnail. */
export function MediaManager({
  projectId,
  thumbnailMediaId,
  items,
}: {
  projectId: string;
  thumbnailMediaId: string | null;
  items: ProjectMedia[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <MediaUploader projectId={projectId} maxBytes={MAX_UPLOAD_BYTES} />
        <ActionForm action={addMediaEmbed.bind(null, projectId)} className="space-y-3 rounded-xl border border-border p-4" resetOnSuccess>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clapperboard className="size-4 text-accent" /> Add a YouTube or Vimeo video
          </p>
          <input name="url" className="input" placeholder="https://youtu.be/…" required maxLength={500} />
          <input name="caption" className="input" placeholder="Caption (optional)" maxLength={300} />
          <SubmitButton className="btn btn-sm" pendingText="Adding…">
            Add video
          </SubmitButton>
        </ActionForm>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
          No media yet. The first image you upload becomes the project thumbnail.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, i) => {
            const isThumb = item.id === thumbnailMediaId;
            return (
              <li key={item.id} className={`overflow-hidden rounded-xl border bg-bg ${isThumb ? "border-accent ring-2 ring-accent/30" : "border-border"}`}>
                <div className="relative aspect-video bg-black">
                  <Preview item={item} />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge color="gray">{item.kind === "embed" ? "video link" : item.kind}</Badge>
                    {isThumb && (
                      <span className="badge border-transparent bg-accent text-white shadow">
                        <Star className="size-3 fill-current" /> Thumbnail
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <form action={updateMediaCaption.bind(null, projectId, item.id)} className="flex gap-2">
                    <input
                      name="caption"
                      defaultValue={item.caption}
                      placeholder="Caption"
                      maxLength={300}
                      className="input h-8 py-1 text-xs"
                    />
                    <SubmitButton className="btn btn-sm">Save</SubmitButton>
                  </form>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted">
                      {item.kind === "embed" ? new URL(item.url).hostname : `${item.filename} · ${formatBytes(item.size)}`}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      {item.kind === "image" && !isThumb && (
                        <form action={setProjectThumbnail.bind(null, projectId, item.id)}>
                          <button type="submit" className="btn btn-sm btn-icon" title="Use as thumbnail" aria-label="Use as thumbnail">
                            <Star className="size-3.5" />
                          </button>
                        </form>
                      )}
                      <form action={moveMedia.bind(null, projectId, item.id, "up")}>
                        <button type="submit" className="btn btn-sm btn-icon" disabled={i === 0} title="Move earlier" aria-label="Move earlier">
                          <ArrowUp className="size-3.5" />
                        </button>
                      </form>
                      <form action={moveMedia.bind(null, projectId, item.id, "down")}>
                        <button
                          type="submit"
                          className="btn btn-sm btn-icon"
                          disabled={i === items.length - 1}
                          title="Move later"
                          aria-label="Move later"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </form>
                      <form action={removeMedia.bind(null, projectId, item.id)}>
                        <ConfirmButton message="Remove this item from the gallery?" className="btn btn-sm btn-icon btn-danger">
                          <Trash2 className="size-3.5" />
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
