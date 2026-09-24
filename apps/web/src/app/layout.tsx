import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Foundry", template: "%s · Foundry" },
  description: "Browse projects, read the code, suggest issues and fixes, and download releases.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-md bg-accent text-sm text-white">F</span>
              Foundry
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Projects
              </Link>
              {admin && (
                <Link href="/admin" className="btn">
                  Admin
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Powered by Foundry
        </footer>
      </body>
    </html>
  );
}
