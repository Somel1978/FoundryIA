"use server";

import { redirect } from "next/navigation";
import { adminConfigProblems, checkPassword, endSession, startSession } from "../auth";
import { clientIp } from "../client-ip";
import type { FormState } from "../forms";
import { rateLimit } from "../rate-limit";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (adminConfigProblems().length > 0) {
    return { error: "Admin login isn't configured correctly — see the notes on this page and the server log." };
  }
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000)) {
    console.warn(`[auth] login rate-limited for ${ip}`);
    return { error: "Too many attempts. Try again in 15 minutes (or restart the server)." };
  }
  const password = fd.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    console.warn(`[auth] failed admin login from ${ip}`);
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
