import { ActionForm, ConfirmButton, SubmitButton } from "@/components/action-form";
import { ProjectFields } from "@/components/project-fields";
import { deleteProject, updateProject } from "@/lib/actions/admin";
import { getProjectById } from "@/lib/projects";

export default async function ProjectSettingsPage({ params }: PageProps<"/admin/projects/[id]">) {
  const project = getProjectById((await params).id);
  return (
    <div className="max-w-2xl space-y-8">
      <ActionForm action={updateProject.bind(null, project.id)} className="card space-y-5 p-6">
        <ProjectFields project={project} />
        <SubmitButton>Save changes</SubmitButton>
      </ActionForm>

      <div className="card border-red-200 p-6 dark:border-red-900">
        <h2 className="font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-500">
          Deletes the project with all its code snapshots, releases, files, issues and fix suggestions.
        </p>
        <form action={deleteProject.bind(null, project.id)}>
          <ConfirmButton message={`Delete "${project.name}" permanently? This cannot be undone.`}>
            Delete project
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
