"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, startSession } from "../auth";
import { clientIp } from "../client-ip";
import type { FormState } from "../forms";
import { rateLimit } from "../rate-limit";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit(`login:${await clientIp()}`, 10, 15 * 60_000)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
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
