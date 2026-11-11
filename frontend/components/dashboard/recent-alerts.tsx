"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { ApiError } from "@/lib/api/client";
import {
  ALERT_EVENT_LABELS,
  alertApi,
  formatAlertRecorded,
  type Alert,
} from "@/lib/api/alerts";

const RECENT_LIMIT = 4;

type LoadStatus = "loading" | "ready" | "error";

function productLine(alert: Alert) {
  const name = alert.product_name ?? "Unknown product";
  return alert.pack_size ? `${name} · ${alert.pack_size}` : name;
}

function distributorLocation(alert: Alert) {
  if (!alert.distributor) return null;

  return [alert.distributor.city, alert.distributor.state]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");
}

function AlertsLoading() {
  return (
    <div className="flex items-center gap-3 px-5 py-8 text-sm font-medium text-dash-muted sm:px-6">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
      />
      Loading recent alerts…
    </div>
  );
}

export function RecentAlerts() {
  const { selectedOrganizationId } = useOrganizations();
  const [items, setItems] = useState<Alert[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);

      try {
        const result = await alertApi.list(selectedOrganizationId, {
          page: 1,
          pageSize: RECENT_LIMIT,
        });
        if (cancelled) return;

        setItems(result.items);
        setStatus("ready");
      } catch (cause) {
        if (cancelled) return;

        setError(
          cause instanceof ApiError
            ? cause.message
            : "We could not load recent alerts. Please try again.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId, reloadKey]);

  const effectiveStatus: LoadStatus = selectedOrganizationId
    ? status
    : "ready";
  const visibleItems = selectedOrganizationId ? items : [];

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
            href="/dashboard/alerts"
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

      {effectiveStatus === "loading" ? (
        <div className="border-t border-dash-line">
          <AlertsLoading />
        </div>
      ) : effectiveStatus === "error" ? (
        <div role="alert" className="border-t border-dash-line px-5 py-8 sm:px-6">
          <p className="text-sm leading-6 text-dash-muted">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
          >
            Try again
          </button>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="border-t border-dash-line px-5 py-8 sm:px-6">
          <p className="text-sm font-semibold leading-5 text-brand-ink">
            No alerts yet
          </p>
          <p className="mt-1 text-[13px] leading-5 text-dash-muted">
            Repeat-code checks and consumer reports will appear here as they
            happen.
          </p>
        </div>
      ) : (
        <>
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
                {visibleItems.map((alert) => {
                  const location = distributorLocation(alert);

                  return (
                    <tr key={alert.id} className="border-t border-dash-line">
                      <td className="px-6 py-2.5 align-top">
                        <p className="text-sm font-semibold leading-5 text-brand-ink">
                          {ALERT_EVENT_LABELS[alert.event_type]}
                        </p>
                        <p className="mt-1 text-[15px] leading-[22px] text-brand-ink">
                          {productLine(alert)}
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
                          {alert.distributor?.name ?? "Not assigned"}
                        </p>
                        <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
                          {location || "Distribution not recorded"}
                        </p>
                      </td>
                      <td className="px-6 pb-2.5 pt-[34px] align-top text-[13px] leading-[18px] text-dash-muted">
                        {formatAlertRecorded(alert.recorded_at)}
                      </td>
                      <td className="px-6 pb-2.5 pt-5 align-top">
                        <StatusBadge status={alert.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet list */}
          <ul className="divide-y divide-dash-line border-t border-dash-line xl:hidden">
            {visibleItems.map((alert) => {
              const location = distributorLocation(alert);

              return (
                <li key={alert.id} className="px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-5 text-brand-ink">
                      {ALERT_EVENT_LABELS[alert.event_type]}
                    </p>
                    <StatusBadge status={alert.status} />
                  </div>

                  <p className="mt-2 text-[15px] font-medium leading-[22px] text-brand-ink">
                    {productLine(alert)}
                  </p>
                  <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
                    {alert.code}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-5 text-dash-muted xl:text-[13px]">
                    {alert.note}
                  </p>

                  <p className="mt-2.5 text-[13px] leading-5 text-brand-ink">
                    {alert.distributor?.name ?? "Not assigned"}
                    {location ? ` · ${location}` : ""}
                  </p>
                  <p className="mt-1.5 text-xs leading-4 text-dash-muted">
                    {formatAlertRecorded(alert.recorded_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}

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
