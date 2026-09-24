/** Shape returned by server actions used with `useActionState`. */
export type FormState = { error?: string; success?: string } | undefined;

export class FormError extends Error {}

interface StringOpts {
  required?: boolean;
  max?: number;
  label?: string;
}

export function readString(fd: FormData, key: string, opts: StringOpts = {}): string {
  const raw = fd.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  const label = opts.label ?? key;
  if (opts.required && !value) throw new FormError(`${label} is required.`);
  if (opts.max && value.length > opts.max) throw new FormError(`${label} must be at most ${opts.max} characters.`);
  return value;
}

/** Like readString but keeps whitespace (for file contents). */
export function readRaw(fd: FormData, key: string, max: number): string {
  const raw = fd.get(key);
  const value = typeof raw === "string" ? raw : "";
  if (value.length > max) throw new FormError(`${key} is too large.`);
  return value;
}

export function readEmail(fd: FormData, key: string): string | null {
  const value = readString(fd, key, { max: 200 });
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new FormError("Please enter a valid email address.");
  return value;
}

/** Hidden field that humans leave empty and naive bots fill in. */
export function isSpam(fd: FormData): boolean {
  const trap = fd.get("website");
  return typeof trap === "string" && trap.length > 0;
}

/** Runs an action body, converting FormErrors into form state. */
export async function handleForm(fn: () => Promise<FormState> | FormState): Promise<FormState> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof FormError) return { error: err.message };
    throw err;
  }
}
