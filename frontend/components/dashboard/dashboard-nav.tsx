"use client";

import {
  Bell,
  Box,
  Flag,
  LayoutGrid,
  ScanLine,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, type DashboardNavIcon } from "@/lib/dashboard";
import { cn } from "@/lib/cn";

const NAV_ICONS: Record<DashboardNavIcon, LucideIcon> = {
  overview: LayoutGrid,
  products: Box,
  distribution: Truck,
  verifications: ScanLine,
  reports: Flag,
  alerts: Bell,
  settings: LayoutGrid,
};

type DashboardNavProps = {
  onNavigate?: () => void;
  className?: string;
};

/**
 * Highlights the section that owns the current route. Only real sub-routes
 * need matching; `/dashboard` itself belongs to the overview.
 */
function useActiveSection() {
  const pathname = usePathname();

  if (pathname === "/dashboard") return "overview" as const;
  if (
    pathname === "/dashboard/products" ||
    pathname.startsWith("/dashboard/products/")
  ) {
    return "products" as const;
  }
  if (
    pathname === "/dashboard/distribution" ||
    pathname.startsWith("/dashboard/distribution/")
  ) {
    return "distribution" as const;
  }
  if (
    pathname === "/dashboard/verifications" ||
    pathname.startsWith("/dashboard/verifications/")
  ) {
    return "verifications" as const;
  }
  if (
    pathname === "/dashboard/reports" ||
    pathname.startsWith("/dashboard/reports/")
  ) {
    return "reports" as const;
  }
  if (
    pathname === "/dashboard/alerts" ||
    pathname.startsWith("/dashboard/alerts/")
  ) {
    return "alerts" as const;
  }

  return null;
}

export function DashboardNav({ onNavigate, className }: DashboardNavProps) {
  const activeSection = useActiveSection();

  return (
    <nav aria-label="Workspace" className={className}>
      <ul className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = item.icon === activeSection;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                  active
                    ? "bg-dash-tint text-brand-ink"
                    : "text-brand-ink/80 hover:bg-dash-soft/70 hover:text-brand-ink",
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.8}
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active
                      ? "text-brand-ink"
                      : "text-dash-muted group-hover:text-brand-ink",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
