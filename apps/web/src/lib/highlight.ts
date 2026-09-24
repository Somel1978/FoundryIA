import "server-only";
import { bundledLanguages, codeToHtml, type BundledLanguage } from "shiki";

const EXT_ALIASES: Record<string, string> = {
  mjs: "js",
  cjs: "js",
  mts: "ts",
  cts: "ts",
  h: "c",
  hpp: "cpp",
  cc: "cpp",
  yml: "yaml",
  htm: "html",
  svelte: "svelte",
  kts: "kotlin",
  gradle: "groovy",
  lock: "json",
  env: "dotenv",
};

const FILENAME_LANGS: Record<string, string> = {
  dockerfile: "docker",
  makefile: "make",
  ".gitignore": "gitignore",
  ".npmrc": "ini",
  ".editorconfig": "ini",
};

export function detectLanguage(filePath: string): string {
  const name = filePath.split("/").pop()?.toLowerCase() ?? "";
  const byName = FILENAME_LANGS[name];
  if (byName && byName in bundledLanguages) return byName;
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  const lang = EXT_ALIASES[ext] ?? ext;
  return lang in bundledLanguages ? lang : "text";
}

const MAX_HIGHLIGHT_CHARS = 300_000;

export async function highlight(code: string, filePath: string): Promise<string> {
  const lang = code.length > MAX_HIGHLIGHT_CHARS ? "text" : detectLanguage(filePath);
  return codeToHtml(code, {
    lang: lang as BundledLanguage,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
