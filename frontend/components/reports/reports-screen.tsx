"use client";

import {
  ArrowRight,
  ChevronDown,
  Download,
  EllipsisVertical,
  Flag,
  Info,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { ReportDialog } from "@/components/reports/report-dialog";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { ApiError } from "@/lib/api/client";
import {
  REPORT_ISSUE_OPTIONS,
  REPORT_STATUS_OPTIONS,
  reportApi,
  type ConsumerReport,
  type ConsumerReportList,
  type ReportIssueFilter,
  type ReportStatus,
  type ReportStatusFilter,
} from "@/lib/api/reports";
import { cn } from "@/lib/cn";

const PAGE_SIZES = [10, 20, 50] as const;

type LoadStatus = "loading" | "ready" | "error";

function formatNumber(value: number) {
  return value.toLocaleString("en-NG");
}

function formatReported(value: string) {
  const date = new Date(value);

  return {
    day: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "Africa/Lagos",
    }).format(date),
    year: new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(date),
  };
}

function reviewerName(report: ConsumerReport) {
  if (!report.reviewer) return "None";

  return `${report.reviewer.first_name} ${report.reviewer.last_name}`.trim();
}

function distributorLocation(report: ConsumerReport) {
  if (!report.distributor) return null;

  const place = [report.distributor.city, report.distributor.state]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");

  return [place, report.distributor.tracking_code]
    .filter(Boolean)
    .join(" · ");
}

function issueClass(concern: ConsumerReport["concern"]) {
  return concern === "Unmatched code" || concern === "Code has already been used"
    ? "text-error"
    : "text-brand-ink";
}

function TableLoading() {
  return (
    <div className="flex items-center gap-3 px-5 py-10 text-sm font-medium text-dash-muted sm:px-6">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
      />
      Loading consumer reports…
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
        <Flag className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-brand-ink">
          {filtered
            ? "No consumer reports match these filters"
            : "No consumer reports yet"}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-dash-muted">
          {filtered
            ? "Try a different search term, issue type, status or location."
            : "Reports submitted from the consumer check journey will appear here."}
        </p>
      </div>
    </div>
  );
}

export function ReportsScreen() {
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [issueFilter, setIssueFilter] = useState<ReportIssueFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<ConsumerReportList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialogReport, setDialogReport] = useState<ConsumerReport | null>(
    null,
  );

  const canManage =
    selectedOrganization?.role === "Owner" ||
    selectedOrganization?.role === "Admin";

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);

      try {
        const result = await reportApi.list(selectedOrganizationId, {
          search,
          issueType: issueFilter,
          status: statusFilter,
          location: locationFilter === "all" ? "" : locationFilter,
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
            : "We could not load consumer reports. Please try again.",
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
    issueFilter,
    statusFilter,
    locationFilter,
    page,
    pageSize,
    reloadKey,
  ]);

  useEffect(() => {
    if (!openMenuId) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-report-menu]")) return;
      setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuId]);

  const locations = data?.locations ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const currentPage = data?.page ?? page;
  const items = data?.items ?? [];
  const effectiveStatus: LoadStatus = selectedOrganizationId
    ? status
    : "ready";
  const hasFilters =
    Boolean(search) ||
    issueFilter !== "all" ||
    statusFilter !== "all" ||
    locationFilter !== "all";

  const showingFrom = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, total);

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const activeFilters = useMemo(
    () =>
      [
        search ? `Search: ${search}` : null,
        issueFilter !== "all" ? issueFilter : null,
        statusFilter !== "all"
          ? REPORT_STATUS_OPTIONS.find(
              (option) => option.value === statusFilter,
            )?.label
          : null,
        locationFilter !== "all" ? locationFilter : null,
      ].filter(Boolean) as string[],
    [search, issueFilter, statusFilter, locationFilter],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleIssueChange(value: ReportIssueFilter) {
    setIssueFilter(value);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleStatusChange(value: ReportStatusFilter) {
    setStatusFilter(value);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handleLocationChange(value: string) {
    setLocationFilter(value);
    setPage(1);
    setSelectedIds(new Set());
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
    setSelectedIds(new Set());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setIssueFilter("all");
    setStatusFilter("all");
    setLocationFilter("all");
    setPage(1);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((current) => {
      if (items.every((item) => current.has(item.id))) {
        return new Set();
      }

      return new Set(items.map((item) => item.id));
    });
  }

  async function quickStatus(report: ConsumerReport, next: ReportStatus) {
    if (!selectedOrganizationId) return;

    setBusyId(report.id);
    setOpenMenuId(null);
    setActionError(null);

    try {
      await reportApi.update(selectedOrganizationId, report.id, {
        status: next,
      });
      setReloadKey((current) => current + 1);
    } catch (cause) {
      setActionError(
        cause instanceof ApiError
          ? cause.message
          : "We could not update this case. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleExport() {
    if (!selectedOrganizationId || exporting) return;

    setExporting(true);
    setExportError(null);

    try {
      const blob = await reportApi.export(selectedOrganizationId, {
        search,
        issueType: issueFilter,
        status: statusFilter,
        location: locationFilter === "all" ? "" : locationFilter,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "consumer-reports.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setExportError(
        cause instanceof ApiError
          ? cause.message
          : "We could not export these cases. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
            Consumer Reports
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[15px] leading-6 text-dash-muted">
            Triage review signals and reported product concerns without
            premature verdicts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || total === 0}
          aria-busy={exporting || undefined}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-dash-line bg-white px-4 text-sm font-semibold text-brand-ink transition-colors hover:border-line-strong hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto xl:mt-1"
        >
          {exporting ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
            />
          ) : (
            <Download aria-hidden="true" className="h-4 w-4" />
          )}
          {exporting ? "Exporting…" : "Export case report"}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          onSubmit={handleSearch}
          role="search"
          className="flex w-full items-center gap-2 sm:w-auto"
        >
          <label htmlFor="report-search" className="sr-only">
            Search consumer reports
          </label>
          <div className="relative min-w-0 flex-1 sm:w-[260px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dash-muted"
            />
            <input
              id="report-search"
              name="search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search case, product or code"
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
          <span className="sr-only">Filter by issue type</span>
          <select
            value={issueFilter}
            onChange={(event) =>
              handleIssueChange(event.target.value as ReportIssueFilter)
            }
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-4 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[178px]"
          >
            <option value="all">All issue types</option>
            {REPORT_ISSUE_OPTIONS.map((option) => (
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
              handleStatusChange(event.target.value as ReportStatusFilter)
            }
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-4 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[168px]"
          >
            <option value="all">All statuses</option>
            {REPORT_STATUS_OPTIONS.map((option) => (
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
          <span className="sr-only">Filter by location</span>
          <select
            value={locationFilter}
            onChange={(event) => handleLocationChange(event.target.value)}
            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-4 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[158px]"
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 h-4 w-4 text-brand-ink"
          />
        </label>
      </div>

      {exportError ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-error/20 bg-error-soft px-4 py-3 text-sm leading-5 text-error"
        >
          {exportError}
        </div>
      ) : null}

      {actionError ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-error/20 bg-error-soft px-4 py-3 text-sm leading-5 text-error"
        >
          {actionError}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-dash-line bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-dash-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-6 text-brand-ink">
              Case register
            </h2>
            {activeFilters.length > 0 ? (
              <p className="mt-0.5 truncate text-xs leading-5 text-dash-muted">
                {activeFilters.join(" · ")}
              </p>
            ) : null}
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <caption className="sr-only">
                  Consumer reports for{" "}
                  {selectedOrganization?.name ?? "your organization"}
                </caption>
                <thead>
                  <tr className="border-b border-dash-line">
                    <th className="w-12 px-5 pb-3 pt-4 sm:px-6">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all cases on this page"
                        className="h-4 w-4 cursor-pointer accent-[#007f45]"
                      />
                    </th>
                    {[
                      "Case code",
                      "Product name/code",
                      "Case/issue",
                      "Reviewer",
                      "Distributor/location",
                      "Date reported",
                      "Status",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="whitespace-nowrap px-3 pb-3 pt-4 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-dash-muted"
                      >
                        {label}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-5 pb-3 pt-4 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-dash-muted sm:px-6"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((report) => {
                    const reported = formatReported(report.created_at);
                    const selected = selectedIds.has(report.id);
                    const distributorLine = distributorLocation(report);
                    const isBusy = busyId === report.id;

                    return (
                      <tr
                        key={report.id}
                        className={cn(
                          "border-b border-dash-line last:border-b-0",
                          selected && "bg-[#eef9f3]",
                        )}
                      >
                        <td
                          className={cn(
                            "px-5 py-4 align-middle sm:px-6",
                            selected && "border-l-2 border-brand",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelected(report.id)}
                            aria-label={`Select case ${report.reference}`}
                            className="h-4 w-4 cursor-pointer accent-[#007f45]"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 align-middle">
                          <p className="text-sm font-semibold leading-5 text-brand-ink">
                            {report.reference}
                          </p>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <p className="max-w-[150px] truncate text-sm font-semibold leading-5 text-brand-ink">
                            {report.product_name ?? "Unknown product"}
                          </p>
                          <p className="mt-0.5 text-xs leading-4 text-dash-muted">
                            {report.code}
                          </p>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <p
                            className={cn(
                              "max-w-[150px] text-sm leading-5",
                              issueClass(report.concern),
                            )}
                          >
                            {report.concern}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 align-middle text-sm text-brand-ink">
                          {reviewerName(report)}
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <p className="max-w-[180px] text-sm font-semibold leading-5 text-brand-ink">
                            {report.distributor?.name ??
                              report.purchase_location ??
                              "Not recorded"}
                          </p>
                          {distributorLine ? (
                            <p className="mt-0.5 text-xs leading-4 text-dash-muted">
                              {distributorLine}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 align-middle">
                          <p className="text-sm leading-5 text-brand-ink">
                            {reported.day}
                          </p>
                          <p className="mt-0.5 text-xs leading-4 text-dash-muted">
                            {reported.year}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 align-middle">
                          <ReportStatusBadge status={report.status} />
                        </td>
                        <td className="px-5 py-4 text-right align-middle sm:px-6">
                          {canManage ? (
                            <div data-report-menu className="relative inline-flex">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId((current) =>
                                    current === report.id ? null : report.id,
                                  )
                                }
                                aria-label={`Actions for case ${report.reference}`}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === report.id}
                                aria-busy={isBusy || undefined}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                              >
                                {isBusy ? (
                                  <span
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
                                  />
                                ) : (
                                  <EllipsisVertical
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                )}
                              </button>

                              {openMenuId === report.id ? (
                                <div
                                  role="menu"
                                  aria-label={`Actions for case ${report.reference}`}
                                  className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-dash-line bg-white p-1 shadow-lg"
                                >
                                  {report.status !== "received" ? (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() =>
                                        quickStatus(report, "received")
                                      }
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                                    >
                                      Mark received
                                    </button>
                                  ) : null}

                                  {report.status !== "under_review" ? (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() =>
                                        quickStatus(report, "under_review")
                                      }
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                                    >
                                      Mark under review
                                    </button>
                                  ) : null}

                                  {report.status !== "referred" ? (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() =>
                                        quickStatus(report, "referred")
                                      }
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                                    >
                                      Refer case
                                    </button>
                                  ) : null}

                                  <div className="my-1 border-t border-dash-line" />

                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDialogReport(report);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                                  >
                                    <UserRound
                                      aria-hidden="true"
                                      className="h-4 w-4"
                                    />
                                    Assign details
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-dash-muted">
                              View only
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-dash-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs leading-5 text-dash-muted">
                Showing {formatNumber(showingFrom)}–{formatNumber(showingTo)} of{" "}
                {formatNumber(total)} cases
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
                    onClick={() => {
                      setPage((current) => Math.max(1, current - 1));
                      setSelectedIds(new Set());
                    }}
                    disabled={currentPage <= 1}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-3 text-xs font-semibold text-dash-muted transition-colors hover:border-line-strong hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage((current) => Math.min(pages, current + 1));
                      setSelectedIds(new Set());
                    }}
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
        <Info
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0"
          strokeWidth={1.8}
        />
        <p>
          A record match does not guarantee authenticity or safety. Investigate
          repeat-use and unmatched-code signals alongside distribution records
          and product evidence.
        </p>
      </div>

      {dialogReport && selectedOrganizationId ? (
        <ReportDialog
          organizationId={selectedOrganizationId}
          report={dialogReport}
          onClose={() => setDialogReport(null)}
          onSaved={() => setReloadKey((current) => current + 1)}
        />
      ) : null}
    </>
  );
}
