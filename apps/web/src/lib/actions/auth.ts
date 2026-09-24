"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, startSession } from "../auth";
import type { FormState } from "../forms";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const password = fd.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    // Slow down brute-force attempts a little.
    await new Promise((r) => setTimeout(r, 750));
    return { error: "Wrong password." };
  }
  await startSession();
  const next = fd.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
