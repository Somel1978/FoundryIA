/** Renders a unified diff with per-line colouring. */
export function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");
  return (
    <div className="card overflow-x-auto">
      <pre className="min-w-max py-2 font-mono text-[13px] leading-5">
        {lines.map((line, i) => {
          let cls = "text-fg";
          if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("===") || line.startsWith("Index:")) {
            cls = "text-muted font-semibold";
          } else if (line.startsWith("@@")) {
            cls = "bg-sky-500/10 text-sky-700 dark:text-sky-300";
          } else if (line.startsWith("+")) {
            cls = "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
          } else if (line.startsWith("-")) {
            cls = "bg-red-500/10 text-red-800 dark:text-red-300";
          }
          return (
            <div key={i} className={`px-4 ${cls}`}>
              {line || " "}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
