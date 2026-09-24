import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

/** Must match apps/web/src/lib/admin-config.ts. */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

let pipedLines;

/** Asks a question; input is hidden when `hidden`. Reads lines from stdin when piped. */
export async function ask(question, { hidden = false } = {}) {
  if (!process.stdin.isTTY) {
    pipedLines ??= (await new Promise((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => resolve(data));
    })).split(/\r?\n/);
    return pipedLines.shift() ?? "";
  }
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

export async function askNewPassword() {
  while (true) {
    const password = await ask("Admin password (min 12 characters): ", { hidden: true });
    if (password.length < 12) {
      console.error("  Too short — use at least 12 characters.");
      if (!process.stdin.isTTY) process.exit(1);
      continue;
    }
    if ((await ask("Repeat password: ", { hidden: true })) !== password) {
      console.error("  Passwords don't match.");
      if (!process.stdin.isTTY) process.exit(1);
      continue;
    }
    return password;
  }
}
