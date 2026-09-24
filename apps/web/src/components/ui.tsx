import Link from "next/link";
import { Globe, Inbox, Lock } from "lucide-react";
import type { FixStatus, IssueStatus, Visibility } from "@foundry/db";

const tone = {
  green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  gray: "border-border bg-surface-2 text-muted",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  red: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  blue: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet: "border-accent/25 bg-accent/10 text-accent",
} as const;

export type Tone = keyof typeof tone;

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: Tone }) {
  return <span className={`badge ${tone[color]}`}>{children}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return visibility === "public" ? (
    <Badge color="green">
      <Globe className="size-3" /> Public
    </Badge>
  ) : (
    <Badge color="amber">
      <Lock className="size-3" /> Private
    </Badge>
  );
}

const issueColors: Record<IssueStatus, Tone> = { open: "blue", accepted: "green", rejected: "red", closed: "gray" };

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge color={issueColors[status]}>{status}</Badge>;
}

const fixColors: Record<FixStatus, Tone> = { pending: "amber", applied: "green", rejected: "red" };

export function FixStatusBadge({ status }: { status: FixStatus }) {
  return <Badge color={fixColors[status]}>{status}</Badge>;
}

export function EmptyState({
  title,
  children,
  icon: Icon = Inbox,
}: {
  title: string;
  children?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
        <Icon className="size-6" />
      </div>
      <p className="font-display font-semibold">{title}</p>
      {children && <div className="mt-1.5 max-w-sm text-sm text-muted">{children}</div>}
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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string; key: string; count?: number; icon?: React.ComponentType<{ className?: string }> }[];
  active: string;
}) {
  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface/60 p-1 backdrop-blur sm:inline-flex">
      {tabs.map(({ key, href, label, count, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
            key === active
              ? "bg-surface-2 font-medium text-fg shadow-sm ring-1 ring-border"
              : "text-muted hover:bg-surface-2/60 hover:text-fg"
          }`}
        >
          {Icon && <Icon className="size-4" />}
          {label}
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-accent/15 px-1.5 text-xs font-semibold text-accent">{count}</span>
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

export function Alert({ tone: t = "amber", children }: { tone?: "amber" | "green" | "red"; children: React.ReactNode }) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tone[t]}`}>{children}</div>;
}

export { ProjectThumbnail } from "./project-thumbnail";
