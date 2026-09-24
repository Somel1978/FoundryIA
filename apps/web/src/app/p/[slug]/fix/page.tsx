import Link from "next/link";
import { notFound } from "next/navigation";
import { readSnapshotFile, UnsafePathError } from "@foundry/storage";
import { encodePath } from "@/lib/format";
import { canSuggest, getViewableProject } from "@/lib/projects";
import { FixEditor } from "./fix-editor";

export default async function SuggestFixPage({ params, searchParams }: PageProps<"/p/[slug]/fix">) {
  const project = await getViewableProject((await params).slug);
  const { path } = await searchParams;
  if (!canSuggest(project) || !project.currentSnapshotId || typeof path !== "string") notFound();

  let file;
  try {
    file = await readSnapshotFile(project.currentSnapshotId, path);
  } catch (err) {
    if (err instanceof UnsafePathError) notFound();
    throw err;
  }
  if (!file || file.binary || file.tooLarge) notFound();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Suggest a fix</h2>
        <p className="text-sm text-muted">
          Editing{" "}
          <Link href={`/p/${project.slug}/tree/${encodePath(file.path)}`} className="link font-mono">
            {file.path}
          </Link>
          . Your change is sent as a diff for review.
        </p>
      </div>
      <FixEditor
        slug={project.slug}
        filePath={file.path}
        baseSnapshotId={project.currentSnapshotId}
        original={file.text}
      />
    </div>
  );
}
