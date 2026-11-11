"use client";

import {
  BadgeCheck,
  Copy,
  Flag,
  Layers3,
  Package,
  ShieldCheck,
  Ticket,
  type LucideIcon,
} from "lucide-react";

import { useOverviewStats } from "@/components/dashboard/overview-stats-provider";
import type { OrganizationOverview } from "@/lib/api/overview";
import {
  DASHBOARD_STAT_DEFINITIONS,
  formatOverviewCount,
  type DashboardStatDefinition,
  type OverviewStatKey,
  type StatIcon,
} from "@/lib/dashboard";

const STAT_ICONS: Record<StatIcon, LucideIcon> = {
  products: Package,
  batches: Layers3,
  purchased: Ticket,
  applied: BadgeCheck,
  matched: ShieldCheck,
  repeat: Copy,
  reports: Flag,
};

function statValue(
  stats: OrganizationOverview | null,
  key: OverviewStatKey,
): number | null {
  if (!stats) return null;
  return stats[key];
}

function StatCard({
  stat,
  value,
}: {
  stat: DashboardStatDefinition;
  value: string;
}) {
  const Icon = STAT_ICONS[stat.icon];

  return (
    <div className="flex min-h-[153px] flex-col rounded-xl border border-dash-line bg-white p-5 xl:min-h-[138px]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-dash-muted xl:text-xs">
          {stat.label}
        </p>
        <Icon
          aria-hidden="true"
          strokeWidth={1.7}
          className="hidden h-[18px] w-[18px] shrink-0 text-brand-ink xl:block"
        />
      </div>

      <p className="mt-3.5 font-display text-[28px] font-bold leading-9 text-brand-ink xl:mt-2 xl:text-[34px] xl:leading-[40px]">
        {value}
      </p>

      <p className="mt-auto pt-2 text-xs leading-4 text-dash-muted xl:mt-3 xl:pt-0 xl:text-[13px] xl:leading-[18px]">
        {stat.description}
      </p>
    </div>
  );
}

export function StatCards() {
  const { stats } = useOverviewStats();

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Verification summary
      </h2>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-x-[17px] xl:gap-y-[25px]">
        {DASHBOARD_STAT_DEFINITIONS.map((stat) => (
          <StatCard
            key={stat.key}
            stat={stat}
            value={formatOverviewCount(statValue(stats, stat.key))}
          />
        ))}
      </div>
    </section>
  );
}
