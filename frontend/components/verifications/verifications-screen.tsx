"use client";

import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  MapPin,
  Search,
  ScanLine,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { VerificationOutcomeBadge } from "@/components/verifications/verification-outcome-badge";
import { ApiError } from "@/lib/api/client";
import {
  VERIFICATION_TABS,
  verificationApi,
  type VerificationAttempt,
  type VerificationAttemptList,
  type VerificationOutcomeFilter,
  type VerificationSort,
} from "@/lib/api/verifications";
import { cn } from "@/lib/cn";

const PAGE_SIZES = [10, 20, 50] as const;

type LoadStatus = "loading" | "ready" | "error";

function formatNumber(value: number) {
  return value.toLocaleString("en-NG");
}

function formatAttemptTime(value: string) {
  const date = new Date(value);

  return {
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(date),
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(date),
  };
}

function eventLabel(attempt: VerificationAttempt) {
  return attempt.result === "repeat" ? "Repeat use detected" : "First check";
}

function locationLabel(attempt: VerificationAttempt) {
  return attempt.location?.trim() || "Not recorded";
}

function TableLoading() {
  return (
    <div className="flex items-center gap-3 px-5 py-10 text-sm font-medium text-dash-muted sm:px-6">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
      />
      Loading verification attempts…
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
        <ScanLine className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-brand-ink">
          {filtered
            ? "No verification attempts match these filters"
            : "No verification attempts yet"}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-dash-muted">
          {filtered
            ? "Try a different search term, product, location or tab."
            : "Consumer code checks will appear here as soon as they happen."}
        </p>
      </div>
    </div>
  );
}

export function VerificationsScreen() {
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] =
    useState<VerificationOutcomeFilter>("all");
  const [productFilter, setProductFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sort, setSort] = useState<VerificationSort>("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[2]);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<VerificationAttemptList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);

      try {
        const result = await verificationApi.list(selectedOrganizationId, {
          search,
          productId: productFilter === "all" ? undefined : productFilter,
          location: locationFilter === "all" ? "" : locationFilter,
          outcome: outcomeFilter,
          sort,
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
            : "We could not load verification attempts. Please try again.",
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
    productFilter,
    locationFilter,
    outcomeFilter,
    sort,
    page,
    pageSize,
    reloadKey,
  ]);

  const counts = data?.counts ?? { all: 0, matches: 0, repeats: 0 };
  const products = data?.products ?? [];
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
    outcomeFilter !== "all" ||
    productFilter !== "all" ||
    locationFilter !== "all";

  const showingFrom = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, total);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleTabChange(value: VerificationOutcomeFilter) {
    setOutcomeFilter(value);
    setPage(1);
  }

  function handleProductChange(value: string) {
    setProductFilter(value);
    setPage(1);
  }

  function handleLocationChange(value: string) {
    setLocationFilter(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setOutcomeFilter("all");
    setProductFilter("all");
    setLocationFilter("all");
    setPage(1);
  }

  return (
    <>
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
          Verifications
        </h1>
        <p className="mt-1.5 max-w-[640px] text-[15px] leading-6 text-dash-muted">
          Review every code check, its record outcome and previous check
          history.
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-dash-line bg-white">
        <div className="border-b border-dash-line px-4 sm:px-5">
          <div
            role="tablist"
            aria-label="Filter attempts by outcome"
            className="flex gap-1 overflow-x-auto"
          >
            {VERIFICATION_TABS.map((tab) => {
              const active = outcomeFilter === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabChange(tab.value)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                    active
                      ? "border-brand text-brand-ink"
                      : "border-transparent text-dash-muted hover:text-brand-ink",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-semibold leading-4",
                      active
                        ? "bg-[#e7f6ee] text-[#0a7a45]"
                        : "bg-dash-soft text-dash-muted",
                    )}
                  >
                    {formatNumber(counts[tab.countKey])}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-dash-line px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              onSubmit={handleSearch}
              role="search"
              className="relative min-w-0 flex-1 lg:max-w-[330px]"
            >
              <label htmlFor="verification-search" className="sr-only">
                Search verification attempts
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dash-muted"
              />
              <input
                id="verification-search"
                name="search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search code or product"
                autoComplete="off"
                spellCheck={false}
                className="h-11 w-full rounded-lg border border-dash-line bg-white pl-10 pr-3 text-sm font-medium text-brand-ink outline-none transition-colors placeholder:text-dash-muted hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              <button type="submit" className="sr-only">
                Search
              </button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="relative inline-flex w-full items-center sm:w-auto">
                <span className="sr-only">Filter by product</span>
                <select
                  value={productFilter}
                  onChange={(event) => handleProductChange(event.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-4 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[178px]"
                >
                  <option value="all">All products</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
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
                <MapPin
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 h-4 w-4 text-dash-muted"
                />
                <select
                  value={locationFilter}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-dash-line bg-white pl-10 pr-10 text-sm font-medium text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[178px]"
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

              <button
                type="button"
                onClick={() =>
                  setSort((current) =>
                    current === "latest" ? "oldest" : "latest",
                  )
                }
                aria-label={`Sort by time, currently ${sort === "latest" ? "latest first" : "oldest first"}`}
                title="Toggle sort order"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-dash-muted transition-colors hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:ml-auto"
              >
                {sort === "latest" ? "Latest first" : "Oldest first"}
                <ArrowDownUp
                  aria-hidden="true"
                  className="h-4 w-4 text-brand-ink"
                />
              </button>
            </div>
          </div>
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
              <table className="w-full min-w-[860px] border-collapse text-left">
                <caption className="sr-only">
                  Verification attempts for{" "}
                  {selectedOrganization?.name ?? "your organization"}
                </caption>
                <thead>
                  <tr className="border-b border-dash-line">
                    {["Code / product", "Event", "Outcome", "Location"].map(
                      (label) => (
                        <th
                          key={label}
                          scope="col"
                          className="whitespace-nowrap px-5 pb-3 pt-4 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-dash-muted sm:px-6"
                        >
                          {label}
                        </th>
                      ),
                    )}
                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 pb-3 pt-4 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-dash-muted sm:px-6"
                    >
                      Time · WAT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((attempt) => {
                    const stamp = formatAttemptTime(attempt.checked_at);

                    return (
                      <tr
                        key={attempt.id}
                        className="border-b border-dash-line last:border-b-0"
                      >
                        <td className="px-5 py-4 align-middle sm:px-6">
                          <p className="font-mono text-sm font-semibold tracking-[0.04em] text-brand-ink">
                            {attempt.code}
                          </p>
                          <p className="mt-0.5 max-w-[220px] truncate text-xs leading-4 text-dash-muted">
                            {attempt.product_name ?? "Unknown product"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-middle text-sm leading-5 text-brand-ink sm:px-6">
                          {eventLabel(attempt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-middle sm:px-6">
                          <VerificationOutcomeBadge outcome={attempt.result} />
                        </td>
                        <td
                          className="whitespace-nowrap px-5 py-4 align-middle text-sm leading-5 text-brand-ink sm:px-6"
                          title={attempt.distributor_name ?? undefined}
                        >
                          {locationLabel(attempt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right align-middle sm:px-6">
                          <p className="text-sm leading-5 text-brand-ink">
                            {stamp.time}
                          </p>
                          <p className="mt-0.5 text-xs leading-4 text-dash-muted">
                            {stamp.date}
                          </p>
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
                {formatNumber(total)} attempts
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
                  Page {currentPage} of {formatNumber(pages)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
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

      {hasFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 text-xs font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          Clear filters
        </button>
      ) : null}
    </>
  );
}
