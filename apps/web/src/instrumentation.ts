/** Runs once when the server boots: refuse to start with an insecure config. */
export function register() {
  if (process.env.NODE_ENV !== "production") return;
  const problems: string[] = [];
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
    problems.push("ADMIN_PASSWORD must be set to at least 12 characters.");
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    problems.push("SESSION_SECRET must be set to at least 32 characters.");
  }
  if (problems.length > 0) {
    throw new Error(`Refusing to start in production:\n  - ${problems.join("\n  - ")}`);
  }
}
