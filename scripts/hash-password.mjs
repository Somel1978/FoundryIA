#!/usr/bin/env node
// Prints an ADMIN_PASSWORD_HASH line. Usage: pnpm hash-password
import { askNewPassword, hashPassword } from "./lib.mjs";

const password = await askNewPassword();
console.log(`\nADMIN_PASSWORD_HASH=${hashPassword(password)}`);
