import { CodeBrowser } from "@/components/code-browser";
import { getViewableProject } from "@/lib/projects";

export default async function ProjectPage({ params }: PageProps<"/p/[slug]">) {
  const project = await getViewableProject((await params).slug);
  return <CodeBrowser project={project} path="" />;
}
