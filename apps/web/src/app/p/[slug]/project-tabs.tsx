"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui";

export function ProjectTabs({ slug, issueCount, releaseCount }: { slug: string; issueCount: number; releaseCount: number }) {
  const pathname = usePathname();
  const base = `/p/${slug}`;
  const active = pathname.startsWith(`${base}/issues`)
    ? "issues"
    : pathname.startsWith(`${base}/releases`)
      ? "releases"
      : "code";
  return (
    <Tabs
      active={active}
      tabs={[
        { key: "code", label: "Code", href: base },
        { key: "issues", label: "Issues", href: `${base}/issues`, count: issueCount },
        { key: "releases", label: "Releases", href: `${base}/releases`, count: releaseCount },
      ]}
    />
  );
}
