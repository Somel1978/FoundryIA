"use client";

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
        { key: "settings", label: "Settings", href: base },
        { key: "code", label: "Code", href: `${base}/code` },
        { key: "releases", label: "Releases", href: `${base}/releases` },
        { key: "issues", label: "Issues", href: `${base}/issues`, count: counts.issues },
        { key: "fixes", label: "Fix suggestions", href: `${base}/fixes`, count: counts.fixes },
      ]}
    />
  );
}
