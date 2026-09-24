#!/usr/bin/env node
// Prints an ADMIN_PASSWORD_HASH line for the given password.
// Usage: pnpm hash-password            (prompts, input hidden)
//        pnpm hash-password 'secret'   (argument; ends up in shell history)
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

let password = process.argv[2];
if (!password) {
  if (!process.stdin.isTTY) {
    password = (await new Promise((r) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => r(d)); })).replace(/\r?\n$/, "");
  } else {
    password = await prompt("New admin password: ");
    if ((await prompt("Repeat password: ")) !== password) {
      console.error("Passwords don't match.");
      process.exit(1);
    }
  }
}
if (password.length < 12) {
  console.error("Use at least 12 characters.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
console.log(`\nAdd this line to apps/web/.env.local (or your environment):\n`);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`);
