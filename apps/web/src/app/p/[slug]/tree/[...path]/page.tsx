import { notFound } from "next/navigation";
import { CodeBrowser } from "@/components/code-browser";
import { decodeSegments } from "@/lib/format";
import { getViewableProject } from "@/lib/projects";

export default async function TreePage({ params }: PageProps<"/p/[slug]/tree/[...path]">) {
  const { slug, path } = await params;
  const project = await getViewableProject(slug);
  const relPath = decodeSegments(path);
  if (relPath === null) notFound();
  return <CodeBrowser project={project} path={relPath} />;
}
