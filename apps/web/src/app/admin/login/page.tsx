import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { LogoMark } from "@/components/logo";
import { login } from "@/lib/actions/auth";
import { adminConfigProblems, isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin login" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  const problems = adminConfigProblems();

  return (
    <div className="mx-auto mt-8 max-w-sm sm:mt-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <LogoMark className="mb-4 size-14 drop-shadow-[0_8px_24px_var(--glow)]" />
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage FoundryVTTAI</p>
      </div>
      {problems.length > 0 ? (
        <div className="card space-y-3 p-6 text-sm">
          <p className="font-medium">Admin login is disabled until this is fixed:</p>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="text-muted">Restart the server after changing environment variables.</p>
        </div>
      ) : (
        <ActionForm action={login} className="card space-y-4 p-6 shadow-xl shadow-black/5">
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
