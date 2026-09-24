import Link from "next/link";
import type { FixStatus, IssueStatus, Visibility } from "@foundry/db";

const tone = {
  green: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  gray: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  amber: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  red: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  blue: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
} as const;

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: keyof typeof tone }) {
  return <span className={`badge ${tone[color]}`}>{children}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return visibility === "public" ? <Badge color="green">Public</Badge> : <Badge color="amber">Private</Badge>;
}

const issueColors: Record<IssueStatus, keyof typeof tone> = {
  open: "blue",
  accepted: "green",
  rejected: "red",
  closed: "gray",
};

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge color={issueColors[status]}>{status}</Badge>;
}

const fixColors: Record<FixStatus, keyof typeof tone> = {
  pending: "amber",
  applied: "green",
  rejected: "red",
};

export function FixStatusBadge({ status }: { status: FixStatus }) {
  return <Badge color={fixColors[status]}>{status}</Badge>;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs({ tabs, active }: { tabs: { href: string; label: string; key: string; count?: number }[]; active: string }) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
            t.key === active
              ? "border-accent font-medium text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className="rounded-full bg-zinc-200 px-1.5 text-xs dark:bg-zinc-800">{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
