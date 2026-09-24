import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { login } from "@/lib/actions/auth";
import { adminConfigProblems, isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin login" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  const problems = adminConfigProblems();

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">Admin</h1>
      {problems.length > 0 ? (
        <div className="card space-y-3 p-6 text-sm">
          <p className="font-medium">Admin login is disabled until this is fixed:</p>
          <ul className="list-disc space-y-2 pl-5 text-zinc-600 dark:text-zinc-400">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="text-zinc-500">Restart the server after changing environment variables.</p>
        </div>
      ) : (
        <ActionForm action={login} className="card space-y-4 p-6">
          <input type="hidden" name="next" value={typeof next === "string" ? next : "/admin"} />
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="input" required autoFocus />
          </div>
          <SubmitButton pendingText="Signing in…" className="btn btn-primary w-full">
            Sign in
          </SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
