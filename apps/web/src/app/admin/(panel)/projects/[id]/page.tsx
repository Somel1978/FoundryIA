import { Images, TriangleAlert } from "lucide-react";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/action-form";
import { MediaManager } from "@/components/media-manager";
import { ProjectFields } from "@/components/project-fields";
import { deleteProject, updateProject } from "@/lib/actions/admin";
import { listProjectMedia } from "@/lib/media";
import { getProjectById } from "@/lib/projects";

export default async function ProjectSettingsPage({ params }: PageProps<"/admin/projects/[id]">) {
  const project = getProjectById((await params).id);
  const media = listProjectMedia(project.id);
  return (
    <div className="space-y-8">
      <ActionForm action={updateProject.bind(null, project.id)} className="card space-y-5 p-6">
        <h2 className="section-title">Details</h2>
        <ProjectFields project={project} />
        <SubmitButton>Save changes</SubmitButton>
      </ActionForm>

      <section className="card p-6">
        <div className="mb-5">
          <h2 className="section-title flex items-center gap-2">
            <Images className="size-5 text-accent" /> Images & videos
          </h2>
          <p className="mt-1 text-sm text-muted">
            Shown in a gallery below the description on the public page. Star an image to use it as the project
            thumbnail.
          </p>
        </div>
        <MediaManager projectId={project.id} thumbnailMediaId={project.thumbnailMediaId} items={media} />
      </section>

      <section className="card border-red-500/30 p-6">
        <h2 className="section-title flex items-center gap-2 text-red-600 dark:text-red-400">
          <TriangleAlert className="size-5" /> Danger zone
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Deletes the project with all its code snapshots, media, releases, files, issues and fix suggestions.
        </p>
        <form action={deleteProject.bind(null, project.id)}>
          <ConfirmButton message={`Delete "${project.name}" permanently? This cannot be undone.`}>Delete project</ConfirmButton>
        </form>
      </section>
    </div>
  );
}
