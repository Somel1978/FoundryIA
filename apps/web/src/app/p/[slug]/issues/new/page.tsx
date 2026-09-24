import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Honeypot } from "@/components/ui";
import { submitIssue } from "@/lib/actions/public";
import { canSuggest, getViewableProject } from "@/lib/projects";

export default async function NewIssuePage({ params }: PageProps<"/p/[slug]/issues/new">) {
  const project = await getViewableProject((await params).slug);
  if (!canSuggest(project)) notFound();

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold">Suggest an issue</h2>
      <ActionForm action={submitIssue.bind(null, project.slug)} className="card relative space-y-4 p-6" resetOnSuccess>
        <Honeypot />
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" className="input" required maxLength={200} placeholder="Short summary" />
        </div>
        <div>
          <label className="label" htmlFor="body">Description</label>
          <textarea
            id="body"
            name="body"
            className="input min-h-48 font-mono"
            required
            maxLength={20000}
            placeholder="What happened? What did you expect? Steps to reproduce… (Markdown supported)"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="authorName">Your name</label>
            <input id="authorName" name="authorName" className="input" required maxLength={100} />
          </div>
          <div>
            <label className="label" htmlFor="authorEmail">Email (optional)</label>
            <input id="authorEmail" name="authorEmail" type="email" className="input" maxLength={200} />
            <p className="hint">Never shown publicly.</p>
          </div>
        </div>
        <SubmitButton pendingText="Submitting…">Submit issue</SubmitButton>
      </ActionForm>
    </div>
  );
}
