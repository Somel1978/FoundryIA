"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/forms";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const PendingContext = createContext(false);

/**
 * A <form> bound to a server action that shows its error/success message.
 *
 * Submissions are dispatched manually instead of via `<form action>` so React
 * doesn't reset the fields afterwards — on a validation error the visitor
 * keeps what they typed. Pass `resetOnSuccess` to clear it after success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.success) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name) fd.set(submitter.name, submitter.value);
        startTransition(() => dispatch(fd));
      }}
    >
      {state?.error && (
        <p className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {state.success}
        </p>
      )}
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}

function usePending(): boolean {
  const inActionForm = useContext(PendingContext);
  const { pending } = useFormStatus();
  return inActionForm || pending;
}

export function SubmitButton({
  children,
  pendingText,
  className = "btn btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const pending = usePending();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** Submit button that asks for confirmation first (works in plain forms too). */
export function ConfirmButton({
  children,
  message,
  className = "btn btn-danger",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const pending = usePending();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
