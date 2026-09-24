"use client";

import { Moon, Sun } from "lucide-react";

/** Inline script (runs before paint) that applies the saved or system theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){document.documentElement.classList.add("dark")}})()`;

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      aria-label="Toggle dark mode"
      onClick={() => {
        const dark = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", dark);
        try {
          localStorage.setItem("theme", dark ? "dark" : "light");
        } catch {}
      }}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
