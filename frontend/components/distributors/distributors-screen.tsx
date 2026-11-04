"use client";

import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  EllipsisVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { DistributorDeleteDialog } from "@/components/distributors/distributor-delete-dialog";
import { DistributorDialog } from "@/components/distributors/distributor-dialog";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { ApiError } from "@/lib/api/client";
import {
  DISTRIBUTOR_TYPE_OPTIONS,
  distributorApi,
  type Distributor,
  type DistributorList,
  type DistributorTypeFilter,
} from "@/lib/api/distributors";
import { cn } from "@/lib/cn";

const PAGE_SIZES = [10, 25, 50] as const;

type LoadStatus = "loading" | "ready" | "error";
type ActiveTab = "distributors" | "supply";

function formatNumber(value: number) {
  return value.toLocaleString("en-NG");
}

function formatOnboarded(value: string) {
  const date = new Date(value);

  return {
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
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

function TableLoading() {
  return (
    <div className="flex items-center gap-3 px-5 py-10 text-sm font-medium text-dash-muted sm:px-6">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
      />
      Loading distributors…
    </div>
  );
}

function EmptyState({
  filtered,
  onAdd,
}: {
  filtered: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3.5 px-5 py-10 sm:flex-row sm:items-center sm:px-6">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
      >
        <Truck className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-brand-ink">
          {filtered ? "No distributors match these filters" : "No distributors yet"}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-dash-muted">
          {filtered
            ? "Try a different name, type or location."
            : "Add the pharmacies and retailers that move your products."}
        </p>
      </div>
      {!filtered ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add distributor
        </button>
      ) : null}
    </div>
  );
}

export function DistributorsScreen() {
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [activeTab, setActiveTab] = useState<ActiveTab>("distributors");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DistributorTypeFilter>("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<DistributorList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Distributor | null>(null);

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
        const result = await distributorApi.list(selectedOrganizationId, {
          search,
          type: typeFilter,
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
            : "We could not load distributors. Please try again.",
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
    typeFilter,
    locationFilter,
    page,
    pageSize,
    reloadKey,
  ]);

  useEffect(() => {
    if (!openMenuId) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-distributor-menu]")) return;
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
    Boolean(search) || typeFilter !== "all" || locationFilter !== "all";

  const showingFrom = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, total);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(distributor: Distributor) {
    setEditing(distributor);
    setOpenMenuId(null);
    setDialogOpen(true);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleTypeChange(value: DistributorTypeFilter) {
    setTypeFilter(value);
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

  async function handleDelete() {
    if (!selectedOrganizationId || !deleteTarget) return;

    await distributorApi.remove(selectedOrganizationId, deleteTarget.id);

    setDeleteTarget(null);
    if (items.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      setReloadKey((current) => current + 1);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
            Distribution
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[15px] leading-6 text-dash-muted">
            Track your product journey
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-base font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto xl:mt-1"
          >
            Add distributor
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <section className="mt-7 overflow-hidden rounded-xl border border-dash-line bg-white">
        <div className="border-b border-dash-line px-5 sm:px-6">
          <div role="tablist" aria-label="Distribution views" className="flex gap-7">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "distributors"}
              onClick={() => setActiveTab("distributors")}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 pb-4 pt-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                activeTab === "distributors"
                  ? "border-brand text-brand-ink"
                  : "border-transparent text-dash-muted hover:text-brand-ink",
              )}
            >
              Distributors
              <span className="rounded bg-dash-soft px-1.5 py-0.5 text-[11px] leading-4 text-dash-muted">
                {formatNumber(total)}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "supply"}
              onClick={() => setActiveTab("supply")}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 pb-4 pt-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                activeTab === "supply"
                  ? "border-brand text-brand-ink"
                  : "border-transparent text-dash-muted hover:text-brand-ink",
              )}
            >
              Supply History
              <span className="rounded bg-dash-soft px-1.5 py-0.5 text-[11px] leading-4 text-dash-muted">
                —
              </span>
            </button>
          </div>
        </div>

        {activeTab === "supply" ? (
          <div className="flex items-start gap-3.5 px-5 py-10 sm:px-6">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
            >
              <Truck className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-brand-ink">
                Supply history is not tracked yet
              </p>
              <p className="mt-1 max-w-[520px] text-[13px] leading-5 text-dash-muted">
                Once distributors record stock movements, their supply history
                will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-dash-line px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <form
                    onSubmit={handleSearch}
                    className="flex w-full items-center gap-2 sm:w-auto"
                  >
                    <label htmlFor="distributor-search" className="sr-only">
                      Search distributor name
                    </label>
                    <div className="relative min-w-0 flex-1 sm:w-64">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dash-muted"
                      />
                      <input
                        id="distributor-search"
                        name="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search distributor name"
                        autoComplete="off"
                        spellCheck={false}
                        className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm font-medium text-ink outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
                    >
                      Search
                    </button>
                  </form>

                  <label className="relative inline-flex w-full items-center sm:w-auto">
                    <span className="sr-only">Filter by distributor type</span>
                    <select
                      value={typeFilter}
                      onChange={(event) =>
                        handleTypeChange(
                          event.target.value as DistributorTypeFilter,
                        )
                      }
                      className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-sm font-medium text-dash-muted outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[168px]"
                    >
                      <option value="all">Distributor Type</option>
                      {DISTRIBUTOR_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ArrowUpDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 h-4 w-4 text-dash-muted"
                    />
                  </label>

                  <label className="relative inline-flex w-full items-center sm:w-auto">
                    <span className="sr-only">Filter by location</span>
                    <select
                      value={locationFilter}
                      onChange={(event) =>
                        handleLocationChange(event.target.value)
                      }
                      className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-sm font-medium text-dash-muted outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-[148px]"
                    >
                      <option value="all">Location</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <ArrowUpDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 h-4 w-4 text-dash-muted"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xs leading-5 text-dash-muted">
                    Latest first
                  </span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((current) => current + 1)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-dash-muted transition-colors hover:border-line-strong hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                  >
                    <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                    Refresh
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
              <EmptyState
                filtered={hasFilters}
                onAdd={canManage ? openCreate : () => undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <caption className="sr-only">
                      Distributors in {selectedOrganization?.name ?? "your organization"}
                    </caption>
                    <thead>
                      <tr className="border-b border-dash-line">
                        {[
                          "Distributor name",
                          "Distributor ID",
                          "Type",
                          "Contact",
                          "Location",
                          "Date onboarded",
                          "Total supplies",
                        ].map((label) => (
                          <th
                            key={label}
                            scope="col"
                            className="whitespace-nowrap px-3 pb-3 pt-4 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-dash-muted first:pl-5 last:pr-3 sm:first:pl-6"
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
                      {items.map((distributor) => {
                        const onboarded = formatOnboarded(
                          distributor.created_at,
                        );

                        return (
                          <tr
                            key={distributor.id}
                            className="border-b border-dash-line last:border-b-0"
                          >
                            <td className="px-3 py-4 align-middle first:pl-5 sm:first:pl-6">
                              <p className="text-sm font-semibold leading-5 text-brand-ink">
                                {distributor.name}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 align-middle text-sm font-medium text-brand-ink">
                              {distributor.tracking_code}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 align-middle text-sm text-dash-muted">
                              {distributor.distributor_type}
                            </td>
                            <td className="px-3 py-4 align-middle">
                              <p className="text-sm font-semibold leading-5 text-brand-ink">
                                {distributor.contact_name ?? "—"}
                              </p>
                              <p className="mt-0.5 text-xs leading-4 text-dash-muted">
                                {distributor.phone}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 align-middle text-sm text-dash-muted">
                              {distributor.city ?? "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 align-middle">
                              <p className="text-sm leading-5 text-brand-ink">
                                {onboarded.time}
                              </p>
                              <p className="mt-0.5 text-xs leading-4 text-dash-muted">
                                {onboarded.date}
                              </p>
                            </td>
                            <td className="px-3 py-4 align-middle text-sm font-medium text-brand-ink">
                              {formatNumber(distributor.total_supplies)}
                            </td>
                            <td className="px-5 py-4 text-right align-middle sm:px-6">
                              {canManage ? (
                                <div
                                  data-distributor-menu
                                  className="relative inline-flex"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenuId((current) =>
                                        current === distributor.id
                                          ? null
                                          : distributor.id,
                                      )
                                    }
                                    aria-label={`Actions for ${distributor.name}`}
                                    aria-haspopup="menu"
                                    aria-expanded={
                                      openMenuId === distributor.id
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                                  >
                                    <EllipsisVertical
                                      aria-hidden="true"
                                      className="h-4 w-4"
                                    />
                                  </button>

                                  {openMenuId === distributor.id ? (
                                    <div
                                      role="menu"
                                      aria-label={`Actions for ${distributor.name}`}
                                      className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-dash-line bg-white p-1 shadow-lg"
                                    >
                                      <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => openEdit(distributor)}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                                      >
                                        <Building2
                                          aria-hidden="true"
                                          className="h-4 w-4"
                                        />
                                        Edit details
                                      </button>
                                      <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setDeleteTarget(distributor);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-error-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/25"
                                      >
                                        <Trash2
                                          aria-hidden="true"
                                          className="h-4 w-4"
                                        />
                                        Remove
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
                    Showing {formatNumber(showingFrom)}–
                    {formatNumber(showingTo)} of {formatNumber(total)}{" "}
                    distributors
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
          </>
        )}
      </section>

      {dialogOpen && selectedOrganizationId ? (
        <DistributorDialog
          organizationId={selectedOrganizationId}
          distributor={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() => setReloadKey((current) => current + 1)}
        />
      ) : null}

      {deleteTarget && selectedOrganizationId ? (
        <DistributorDeleteDialog
          distributorName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  );
}
