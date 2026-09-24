import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import { LayoutDashboard } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/logo";
import { ThemeToggle, themeScript } from "@/components/theme-toggle";
import { isAdmin } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FoundryVTTAI", template: "%s · FoundryVTTAI" },
  description: "Browse FoundryVTTAI projects, read the code, suggest issues and fixes, and download releases.",
  applicationName: "FoundryVTTAI",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <div className="page-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]" />
        <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark className="size-8 drop-shadow-[0_2px_8px_var(--glow)]" />
              <Wordmark />
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="btn btn-ghost hidden sm:inline-flex">
                Projects
              </Link>
              {admin && (
                <Link href="/admin" className="btn btn-ghost">
                  <LayoutDashboard className="size-4" />
                  Admin
                </Link>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <footer className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
            <div className="flex items-center gap-2">
              <LogoMark className="size-5" />
              <span>© {new Date().getFullYear()} FoundryVTTAI</span>
            </div>
            <span>Open source projects · community driven</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
