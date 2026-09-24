import type { Project } from "@foundry/db";

export function ProjectFields({ project }: { project?: Project }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" className="input" required maxLength={100} defaultValue={project?.name} />
        </div>
        <div>
          <label className="label" htmlFor="slug">URL slug</label>
          <input
            id="slug"
            name="slug"
            className="input font-mono"
            maxLength={64}
            defaultValue={project?.slug}
            placeholder="generated from the name"
          />
          <p className="hint">Public URL: /p/&lt;slug&gt;</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          className="input min-h-20"
          maxLength={500}
          defaultValue={project?.description}
        />
      </div>
      <fieldset>
        <legend className="label">Visibility</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["private", "Private", "Only you can see it."],
              ["public", "Public", "Anyone can browse the code and releases."],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 transition has-checked:border-accent has-checked:bg-accent/10"
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                defaultChecked={(project?.visibility ?? "private") === value}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="acceptSuggestions" defaultChecked={project?.acceptSuggestions ?? true} />
        Let visitors suggest issues and fixes (public projects only)
      </label>
    </>
  );
}
