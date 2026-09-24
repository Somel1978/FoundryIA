import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { login } from "@/lib/actions/auth";
import { adminPasswordConfigured, isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin login" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">Admin</h1>
      {!adminPasswordConfigured() ? (
        <div className="card p-6 text-sm">
          Set the <code className="font-mono">ADMIN_PASSWORD</code> environment variable (see{" "}
          <code className="font-mono">.env.example</code>) and restart the server.
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
