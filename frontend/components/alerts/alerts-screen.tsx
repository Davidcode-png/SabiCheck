"use client";

import {
  ArrowRight,
  Bell,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { ApiError } from "@/lib/api/client";
import {
  ALERT_EVENT_LABELS,
  ALERT_EVENT_OPTIONS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_OPTIONS,
  alertApi,
  formatAlertRecorded,
  type Alert,
  type AlertEventFilter,
  type AlertList,
  type AlertStatusFilter,
} from "@/lib/api/alerts";

const PAGE_SIZES = [10, 20, 50] as const;

type LoadStatus = "loading" | "ready" | "error";

function formatNumber(value: number) {
  return value.toLocaleString("en-NG");
}

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

function TableLoading() {
  return (
    <div className="flex items-center gap-3 px-5 py-10 text-sm font-medium text-dash-muted sm:px-6">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
      />
      Loading alerts…
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3.5 px-5 py-10 sm:flex-row sm:items-center sm:px-6">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
      >
        <Bell className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-brand-ink">
          {filtered ? "No alerts match these filters" : "No alerts yet"}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-dash-muted">
          {filtered
            ? "Try a different search term, event type or status."
            : "Repeat-code checks and consumer reports will appear here as they happen."}
        </p>
      </div>
    </div>
  );
}

export function AlertsScreen() {
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<AlertEventFilter>("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<AlertList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);

      try {
        const result = await alertApi.list(selectedOrganizationId, {
          search,
          eventType: eventFilter,
          status: statusFilter,
          page,
          pageSize,
        });
        if (cancelled) return;

        setData(result);
        setStatus("ready");
      } catch (cause) {
        if (cancelled) return;

        setError(
          cause instanceof ApiError
            ? cause.message
            : "We could not load alerts. Please try again.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedOrganizationId,
    search,
    eventFilter,
    statusFilter,
    page,
    pageSize,
    reloadKey,
  ]);

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const currentPage = data?.page ?? page;
  const items = data?.items ?? [];
  const effectiveStatus: LoadStatus = selectedOrganizationId
    ? status
    : "ready";
  const hasFilters =
    Boolean(search) || eventFilter !== "all" || statusFilter !== "all";

  const showingFrom = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, total);

  const activeFilters = useMemo(
    () =>
      [
        search ? `Search: ${search}` : null,
        eventFilter !== "all" ? ALERT_EVENT_LABELS[eventFilter] : null,
        statusFilter !== "all" ? ALERT_STATUS_LABELS[statusFilter] : null,
      ].filter(Boolean) as string[],
    [search, eventFilter, statusFilter],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleEventChange(value: AlertEventFilter) {
    setEventFilter(value);
    setPage(1);
  }

  function handleStatusChange(value: AlertStatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setEventFilter("all");
    setStatusFilter("all");
    setPage(1);
  }

  return (
    <>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
            Alerts
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[15px] leading-6 text-dash-muted">
            Repeat-code checks and consumer reports for your products, with the
            distribution context behind each code.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          onSubmit={handleSearch}
          role="search"
          className="flex w-full items-center gap-2 sm:w-auto"
        >
          <label htmlFor="alert-search" className="sr-only">
            Search alerts
          </label>
          <div className="relative min-w-0 flex-1 sm:w-[260px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dash-muted"
            />
            <input
              id="alert-search"
              name="search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search product, code or distributor"
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full rounded-lg border border-dash-line bg-white pl-10 pr-3 text-sm font-medium text-brand-ink outline-none transition-colors placeholder:text-dash-muted hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
          >
            Search
          </button>
        </form>

        <label className="relative inline-flex w-full items-center sm:w-auto">
          <span className="sr-only">Filter by event type</span>
          <select
            value={eventFilter}
            onChange={(event) =>
              handleEventChange(event.target.value as AlertEventFilter)
            }
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-4 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[190px]"
          >
            <option value="all">All event types</option>
            {ALERT_EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 h-4 w-4 text-brand-ink"
          />
        </label>

        <label className="relative inline-flex w-full items-center sm:w-auto">
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              handleStatusChange(event.target.value as AlertStatusFilter)
            }
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-4 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[168px]"
          >
            <option value="all">All statuses</option>
            {ALERT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 h-4 w-4 text-brand-ink"
          />
        </label>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-dash-line bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-dash-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-6 text-brand-ink">
              Alert feed
            </h2>
            {activeFilters.length > 0 ? (
              <p className="mt-0.5 truncate text-xs leading-5 text-dash-muted">
                {activeFilters.join(" · ")}
              </p>
            ) : (
              <p className="mt-0.5 text-xs leading-5 text-dash-muted">
                Newest first · All times WAT
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            aria-label="Clear filters"
            title="Clear filters"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              strokeWidth={1.8}
            />
          </button>
        </div>

        {effectiveStatus === "loading" && !data ? (
          <TableLoading />
        ) : effectiveStatus === "error" ? (
          <div role="alert" className="px-5 py-8 sm:px-6">
            <p className="text-sm leading-6 text-dash-muted">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState filtered={hasFilters} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden xl:block">
              <table className="w-full table-fixed border-collapse text-left">
                <caption className="sr-only">
                  Alerts for{" "}
                  {selectedOrganization?.name ?? "your organization"}
                </caption>
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
                  {items.map((alert) => {
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
            <ul className="divide-y divide-dash-line xl:hidden">
              {items.map((alert) => {
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

            <div className="flex flex-col gap-3 border-t border-dash-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs leading-5 text-dash-muted">
                Showing {formatNumber(showingFrom)}–{formatNumber(showingTo)} of{" "}
                {formatNumber(total)} alerts
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-dash-muted">
                  <span className="sr-only">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      handlePageSizeChange(Number(event.target.value))
                    }
                    className="h-8 cursor-pointer rounded-lg border border-line bg-white px-2 text-xs font-medium text-dash-muted outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>
                </label>

                <span className="text-xs leading-5 text-dash-muted">
                  Page {currentPage} of {pages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-3 text-xs font-semibold text-dash-muted transition-colors hover:border-line-strong hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(pages, current + 1))
                    }
                    disabled={currentPage >= pages}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-dash-muted transition-colors hover:border-line-strong hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-lg bg-[#eef4fb] px-4 py-3.5 text-[13px] leading-5 text-[#334e68]">
        <Bell
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0"
          strokeWidth={1.8}
        />
        <p>
          Repeated checks alone do not establish counterfeiting. Review the code
          history, distribution records and consumer details before taking
          action.
        </p>
      </div>
    </>
  );
}
