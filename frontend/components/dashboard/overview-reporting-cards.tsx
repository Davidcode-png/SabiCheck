"use client";

import { useOverviewStats } from "@/components/dashboard/overview-stats-provider";
import { ReportingCard } from "@/components/dashboard/reporting-card";
import type { ReportingItem } from "@/lib/dashboard";

const SUBTITLE = "Consumer reports · All time";

export function OverviewReportingCards() {
  const { stats, status } = useOverviewStats();

  const products: ReadonlyArray<ReportingItem> =
    stats?.most_reported_products ?? [];
  const distributors: ReadonlyArray<ReportingItem> =
    stats?.most_reported_distributors ?? [];

  const emptyMessage =
    status === "loading"
      ? "Loading consumer reports…"
      : status === "error"
        ? "We could not load consumer reports."
        : "No consumer reports yet.";

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <ReportingCard
        id="products"
        title="Most-reported products"
        subtitle={SUBTITLE}
        columnLabel="Product / pack size"
        items={products}
        icon="product"
        footnote="Reports are consumer submissions, not confirmed product issues."
        actionLabel="View product reports"
        actionHref="/dashboard/reports"
        emptyMessage={emptyMessage}
      />

      <ReportingCard
        id="distribution"
        title="Most-reported distributors"
        subtitle={SUBTITLE}
        columnLabel="Distributor / location"
        items={distributors}
        icon="distributor"
        footnote="Reported distribution context does not establish distributor responsibility."
        actionLabel="View distributor reports"
        actionHref="/dashboard/reports"
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
