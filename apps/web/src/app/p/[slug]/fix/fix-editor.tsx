"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Honeypot } from "@/components/ui";
import { submitFix } from "@/lib/actions/public";

export function FixEditor({
  slug,
  filePath,
  baseSnapshotId,
  original,
}: {
  slug: string;
  filePath: string;
  baseSnapshotId: string;
  original: string;
}) {
  const [content, setContent] = useState(original);
  const changed = content !== original;

  return (
    <ActionForm action={submitFix.bind(null, slug)} className="relative space-y-4">
      <Honeypot />
      <input type="hidden" name="filePath" value={filePath} />
      <input type="hidden" name="baseSnapshotId" value={baseSnapshotId} />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-4 py-2.5 text-xs text-muted">
          <span className="font-mono">{filePath}</span>
          <span className="flex items-center gap-3">
            {changed ? <span className="text-amber-600">Modified</span> : <span>Unchanged</span>}
            {changed && (
              <button type="button" className="link" onClick={() => setContent(original)}>
                Reset
              </button>
            )}
          </span>
        </div>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            // Insert a tab instead of moving focus.
            if (e.key === "Tab" && !e.shiftKey) {
              e.preventDefault();
              const el = e.currentTarget;
              const { selectionStart: s, selectionEnd: end } = el;
              const next = content.slice(0, s) + "\t" + content.slice(end);
              setContent(next);
              requestAnimationFrame(() => el.setSelectionRange(s + 1, s + 1));
            }
          }}
          spellCheck={false}
          className="block h-[60vh] w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-5 outline-none"
        />
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="title">Summary of the fix</label>
          <input id="title" name="title" className="input" required maxLength={200} placeholder="Fix typo in greeting" />
        </div>
        <div>
          <label className="label" htmlFor="description">Details (optional)</label>
          <textarea id="description" name="description" className="input min-h-24" maxLength={20000} />
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
        <SubmitButton pendingText="Submitting…">Submit fix</SubmitButton>
      </div>
    </ActionForm>
  );
}
