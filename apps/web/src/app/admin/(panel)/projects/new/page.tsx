import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { ProjectFields } from "@/components/project-fields";
import { PageHeader } from "@/components/ui";
import { createProject } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New project" description="You can upload code right after creating it." />
      <ActionForm action={createProject} className="card space-y-5 p-6">
        <ProjectFields />
        <SubmitButton pendingText="Creating…">Create project</SubmitButton>
      </ActionForm>
    </div>
  );
}
