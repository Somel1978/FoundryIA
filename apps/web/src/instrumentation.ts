/** Runs once when the server boots: report config problems loudly. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Repeat here in case the server runs in a different process than the one
  // that evaluated next.config.ts.
  const { loadRootEnv } = await import("@foundry/env");
  const files = loadRootEnv();
  if (files.length > 0) console.log(`[config] Loaded ${files.join(", ")}`);
  const { adminConfigProblems } = await import("./lib/admin-config");
  const problems = adminConfigProblems();
  if (problems.length > 0) {
    console.error(`[config] Admin login is disabled:\n  - ${problems.join("\n  - ")}`);
  } else {
    const how = process.env.ADMIN_PASSWORD_HASH ? "ADMIN_PASSWORD_HASH" : "ADMIN_PASSWORD";
    console.log(`[config] Admin login enabled (${how}).`);
  }
}
