import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { RECENT_ALERTS } from "@/lib/dashboard";

export function RecentAlerts() {
  return (
    <section
      id="recent-alerts"
      aria-labelledby="recent-alerts-heading"
      className="mt-6 scroll-mt-24 overflow-hidden rounded-xl border border-dash-line bg-white"
    >
      <div className="px-5 pb-3 pt-5 xl:px-6">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="recent-alerts-heading"
            className="font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl xl:leading-7"
          >
            Recent alerts
          </h2>
          <Link
            href="/dashboard/reports"
            className="inline-flex shrink-0 items-center gap-1.5 rounded text-[13px] font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 xl:text-sm"
          >
            View all
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
          Latest activity · All times WAT
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden xl:block">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">Recent verification alerts</caption>
          <colgroup>
            <col />
            <col className="w-[217px]" />
            <col className="w-[207px]" />
            <col className="w-[144px]" />
          </colgroup>
          <thead>
            <tr className="bg-dash-canvas">
              <th
                scope="col"
                className="px-6 py-2.5 text-[11px] font-bold uppercase leading-4 tracking-[0.06em] text-dash-muted"
              >
                Event / reported product / code
              </th>
              <th
                scope="col"
                className="px-6 py-2.5 text-[11px] font-bold uppercase leading-4 tracking-[0.06em] text-dash-muted"
              >
                Distribution context
              </th>
              <th
                scope="col"
                className="px-6 py-2.5 text-[11px] font-bold uppercase leading-4 tracking-[0.06em] text-dash-muted"
              >
                Recorded
              </th>
              <th
                scope="col"
                className="px-6 py-2.5 text-[11px] font-bold uppercase leading-4 tracking-[0.06em] text-dash-muted"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {RECENT_ALERTS.map((alert, index) => (
              <tr
                key={`${alert.code}-${index}`}
                className="border-t border-dash-line"
              >
                <td className="px-6 py-2.5 align-top">
                  <p className="text-sm font-semibold leading-5 text-brand-ink">
                    {alert.type}
                  </p>
                  <p className="mt-1 text-[15px] leading-[22px] text-brand-ink">
                    {alert.product} · {alert.pack}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-[18px] text-dash-muted">
                    {alert.code}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-[18px] text-dash-muted">
                    {alert.note}
                  </p>
                </td>
                <td className="px-6 pb-2.5 pt-[34px] align-top">
                  <p className="text-sm leading-5 text-brand-ink">
                    {alert.distributor}
                  </p>
                  <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
                    {alert.location}
                  </p>
                </td>
                <td className="px-6 pb-2.5 pt-[34px] align-top text-[13px] leading-[18px] text-dash-muted">
                  {alert.recorded}
                </td>
                <td className="px-6 pb-2.5 pt-5 align-top">
                  <StatusBadge status={alert.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet list */}
      <ul className="divide-y divide-dash-line border-t border-dash-line xl:hidden">
        {RECENT_ALERTS.map((alert, index) => (
          <li key={`${alert.code}-${index}`} className="px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-5 text-brand-ink">
                {alert.type}
              </p>
              <StatusBadge status={alert.status} />
            </div>

            <p className="mt-2 text-[15px] font-medium leading-[22px] text-brand-ink">
              {alert.product} · {alert.pack}
            </p>
            <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
              {alert.code}
            </p>
            <p className="mt-2 text-[12.5px] leading-5 text-dash-muted xl:text-[13px]">
              {alert.note}
            </p>

            <p className="mt-2.5 text-[13px] leading-5 text-brand-ink">
              {alert.distributor} · {alert.location}
            </p>
            <p className="mt-1.5 text-xs leading-4 text-dash-muted">
              {alert.recorded}
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-dash-line px-5 py-3.5 xl:px-6">
        <p className="text-xs leading-5 text-dash-muted xl:text-[13px] xl:leading-5">
          Review the code history, distribution records and consumer details
          before taking action. Repeated use alone does not establish
          counterfeiting.
        </p>
      </div>
    </section>
  );
}
