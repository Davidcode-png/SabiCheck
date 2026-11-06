"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { WorkspaceAssistant } from "@/components/dashboard/workspace-assistant";
import { useOrganizations } from "@/components/organizations/organization-provider";

export type DashboardBreadcrumbItem = {
  label: string;
  href?: string;
};

const DEFAULT_BREADCRUMB: ReadonlyArray<DashboardBreadcrumbItem> = [
  { label: "Workspace", href: "/dashboard" },
  { label: "Overview" },
];

export function DashboardTopbar({
  breadcrumb = DEFAULT_BREADCRUMB,
}: {
  breadcrumb?: ReadonlyArray<DashboardBreadcrumbItem>;
}) {
  const { selectedOrganization } = useOrganizations();

  return (
    <header className="sticky top-0 z-30 hidden h-[79px] border-b border-dash-line bg-white xl:block">
      <div className="flex h-full items-center justify-between gap-6 px-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumb.map((item, index) => {
              const isCurrent = index === breadcrumb.length - 1;

              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-dash-line">
                      /
                    </span>
                  ) : null}

                  {item.href && !isCurrent ? (
                    <Link
                      href={item.href}
                      className="rounded text-dash-muted transition-colors hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isCurrent ? "page" : undefined}
                      className={
                        isCurrent
                          ? "font-medium text-brand-ink"
                          : "text-dash-muted"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex items-center gap-6">
          <p className="max-w-[280px] truncate text-sm text-dash-muted">
            {selectedOrganization?.name}
          </p>
          <WorkspaceAssistant
            key={selectedOrganization?.id ?? "no-workspace"}
          />
          <Link
            href="/dashboard#recent-alerts"
            aria-label="View recent alerts"
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
