import { CodeBrowser } from "@/components/code-browser";
import { MediaGallery } from "@/components/media-gallery";
import { galleryItems } from "@/lib/media";
import { getViewableProject } from "@/lib/projects";

export default async function ProjectPage({ params }: PageProps<"/p/[slug]">) {
  const project = await getViewableProject((await params).slug);
  const media = galleryItems(project.id);
  return (
    <div className="space-y-10">
      {media.length > 0 && <MediaGallery items={media} title={project.name} />}
      <CodeBrowser project={project} path="" />
    </div>
  );
}
