/** Renders a unified diff with per-line colouring. */
export function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");
  return (
    <div className="card overflow-x-auto">
      <pre className="min-w-max py-2 font-mono text-[13px] leading-5">
        {lines.map((line, i) => {
          let cls = "text-zinc-700 dark:text-zinc-300";
          if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("===") || line.startsWith("Index:")) {
            cls = "text-zinc-500 font-semibold";
          } else if (line.startsWith("@@")) {
            cls = "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";
          } else if (line.startsWith("+")) {
            cls = "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
          } else if (line.startsWith("-")) {
            cls = "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300";
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
