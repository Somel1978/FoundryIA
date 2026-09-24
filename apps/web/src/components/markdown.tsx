import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Safe markdown rendering: raw HTML in the source is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-display prose-a:text-accent prose-img:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-surface-2 prose-pre:text-fg">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
