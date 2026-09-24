"use client";

import { Code2, CircleDot, Package } from "lucide-react";
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
        { key: "code", label: "Overview & code", href: base, icon: Code2 },
        { key: "issues", label: "Issues", href: `${base}/issues`, count: issueCount, icon: CircleDot },
        { key: "releases", label: "Releases", href: `${base}/releases`, count: releaseCount, icon: Package },
      ]}
    />
  );
}
