"use client";

import { CalendarDays, ChevronDown, Download } from "lucide-react";
import { useState } from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { useOverviewStats } from "@/components/dashboard/overview-stats-provider";
import {
  OVERVIEW_CSV_FILENAME,
  REPORTING_PERIOD,
  buildOverviewCsv,
} from "@/lib/dashboard";

export function DashboardActions() {
  const { selectedOrganization } = useOrganizations();
  const { stats } = useOverviewStats();
  const [announcement, setAnnouncement] = useState("");

  function exportOverview() {
    const csv = buildOverviewCsv(selectedOrganization?.name, stats ?? {});
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = OVERVIEW_CSV_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setAnnouncement("Overview exported as a CSV file.");
  }

  return (
    <div className="flex w-full flex-col gap-6 xl:w-auto xl:flex-row xl:items-center xl:gap-3.5">
      <div className="relative flex h-[43px] w-full items-center rounded-lg border border-dash-line bg-white pl-3.5 pr-2.5 transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 xl:h-11 xl:w-[190px]">
        <CalendarDays
          aria-hidden="true"
          className="h-[18px] w-[18px] shrink-0 text-brand-ink"
          strokeWidth={1.8}
        />
        <span className="whitespace-nowrap pl-2.5 pr-6 text-sm font-medium text-brand-ink">
          {REPORTING_PERIOD.period}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 h-4 w-4 text-brand-ink"
          strokeWidth={2}
        />
        {/* Only the current reporting window is available in this demo. */}
        <select
          aria-label="Reporting period"
          defaultValue="01-16-oct-2026"
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          <option value="01-16-oct-2026">01–16 Oct 2026</option>
        </select>
      </div>

      <button
        type="button"
        onClick={exportOverview}
        className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-dash-line bg-white px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 xl:w-auto"
      >
        <Download
          aria-hidden="true"
          className="h-[18px] w-[18px]"
          strokeWidth={1.8}
        />
        Export overview
      </button>

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
