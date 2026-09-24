"use client";

import { CircleDot, Code2, GitPullRequestArrow, Package, Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui";

export function AdminProjectTabs({
  projectId,
  counts,
}: {
  projectId: string;
  counts: { issues: number; fixes: number };
}) {
  const pathname = usePathname();
  const base = `/admin/projects/${projectId}`;
  const key = pathname.slice(base.length).split("/")[1] || "settings";
  return (
    <Tabs
      active={key}
      tabs={[
        { key: "settings", label: "Details & media", href: base, icon: Settings2 },
        { key: "code", label: "Code", href: `${base}/code`, icon: Code2 },
        { key: "releases", label: "Releases", href: `${base}/releases`, icon: Package },
        { key: "issues", label: "Issues", href: `${base}/issues`, count: counts.issues, icon: CircleDot },
        { key: "fixes", label: "Fixes", href: `${base}/fixes`, count: counts.fixes, icon: GitPullRequestArrow },
      ]}
    />
  );
}
