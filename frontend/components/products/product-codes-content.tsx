"use client";

import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  QrCode,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { PurchaseCodesDialog } from "@/components/products/purchase-codes-dialog";
import { VerificationCodeStatusBadge } from "@/components/products/verification-code-status-badge";
import { ApiError } from "@/lib/api/client";
import {
  distributorApi,
  type Distributor,
} from "@/lib/api/distributors";
import {
  VERIFICATION_CODE_STATUS_OPTIONS,
  formatKobo,
  verificationCodeApi,
  type VerificationCode,
  type VerificationCodeList,
  type VerificationCodeStatus,
  type VerificationCodeStatusFilter,
} from "@/lib/api/verification-codes";
import { formatRequestedCodes, type RegistryProduct } from "@/lib/product-registry";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 50;

const BULK_UNASSIGNED = "__unassigned__";

type LoadStatus = "loading" | "ready" | "error";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function distributorLocation(code: VerificationCode) {
  if (!code.distributor) return null;

  return [code.distributor.city, code.distributor.state]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");
}

function DistributorSelect({
  code,
  distributors,
  disabled,
  onChange,
}: {
  code: VerificationCode;
  distributors: Distributor[];
  disabled: boolean;
  onChange: (distributorId: string | null) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Assign distributor for {code.code}</span>
      <select
        value={code.distributor_id ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-9 max-w-[190px] rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-wait disabled:opacity-60"
      >
        <option value="">Unassigned</option>
        {distributors.map((distributor) => (
          <option key={distributor.id} value={distributor.id}>
            {distributor.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dash-line bg-white p-4 sm:p-5">
      <p className="text-sm font-medium leading-5 text-dash-muted">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold leading-8 text-brand-ink">
        {formatRequestedCodes(value)}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-dash-muted">
        {description}
      </p>
    </div>
  );
}

function StatusSelect({
  code,
  disabled,
  onChange,
}: {
  code: VerificationCode;
  disabled: boolean;
  onChange: (status: VerificationCodeStatus) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Change status for {code.code}</span>
      <select
        value={code.status}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value as VerificationCodeStatus)
        }
        className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-wait disabled:opacity-60"
      >
        <option value="unused">Unused</option>
        <option value="verified">Verified</option>
        <option value="used">Used</option>
        <option value="reported">Reported</option>
      </select>
    </label>
  );
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label="Select all codes on this page"
      className="h-4 w-4 cursor-pointer rounded border-line accent-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

export function ProductCodesContent({
  product,
  organizationId,
  organizationName,
  manufacturerPrefix,
  canManage,
}: {
  product: RegistryProduct;
  organizationId: string;
  organizationName: string;
  manufacturerPrefix: string;
  canManage: boolean;
}) {
  const [filter, setFilter] = useState<VerificationCodeStatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<VerificationCodeList | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDistributorId, setBulkDistributorId] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await distributorApi.list(organizationId, {
          pageSize: 100,
        });
        if (!cancelled) setDistributors(result.items);
      } catch {
        if (!cancelled) setDistributors([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);

      try {
        const result = await verificationCodeApi.list(
          organizationId,
          product.id,
          {
            status: filter,
            search,
            page,
            pageSize: PAGE_SIZE,
          },
        );
        if (cancelled) return;

        setData(result);
        setStatus("ready");
      } catch (cause) {
        if (cancelled) return;

        setError(
          cause instanceof ApiError
            ? cause.message
            : "We could not load verification codes. Please try again.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, product.id, filter, search, page, reloadKey]);

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkDistributorId("");
    setBulkNotice(null);
  }

  function handleFilterChange(next: VerificationCodeStatusFilter) {
    setFilter(next);
    setPage(1);
    setUpdateError(null);
    clearSelection();
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
    clearSelection();
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    clearSelection();
  }

  async function handleStatusChange(
    code: VerificationCode,
    nextStatus: VerificationCodeStatus,
  ) {
    if (nextStatus === code.status) return;

    setUpdatingId(code.id);
    setUpdateError(null);

    try {
      const updated = await verificationCodeApi.update(
        organizationId,
        product.id,
        code.id,
        { status: nextStatus },
      );

      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : current,
      );
      setReloadKey((current) => current + 1);
    } catch (cause) {
      setUpdateError(
        cause instanceof ApiError
          ? cause.message
          : "We could not update this code. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDistributorChange(
    code: VerificationCode,
    nextDistributorId: string | null,
  ) {
    if ((code.distributor_id ?? null) === nextDistributorId) return;

    setUpdatingId(code.id);
    setUpdateError(null);

    try {
      const updated = await verificationCodeApi.update(
        organizationId,
        product.id,
        code.id,
        { distributor_id: nextDistributorId },
      );

      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : current,
      );
      setReloadKey((current) => current + 1);
    } catch (cause) {
      setUpdateError(
        cause instanceof ApiError
          ? cause.message
          : "We could not assign this distributor. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleCodeSelection(codeId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(codeId);
      } else {
        next.delete(codeId);
      }

      return next;
    });
    setBulkNotice(null);
  }

  function toggleAllCodes(checked: boolean) {
    setSelectedIds(
      checked && data
        ? new Set(data.items.map((code) => code.id))
        : new Set(),
    );
    setBulkNotice(null);
  }

  async function handleBulkAssign() {
    const codeIds = data
      ? data.items
          .filter((code) => selectedIds.has(code.id))
          .map((code) => code.id)
      : [];

    if (!bulkDistributorId || codeIds.length === 0 || bulkAssigning) {
      return;
    }

    const distributorId =
      bulkDistributorId === BULK_UNASSIGNED ? null : bulkDistributorId;

    setBulkAssigning(true);
    setUpdateError(null);
    setBulkNotice(null);

    try {
      const result = await verificationCodeApi.bulkAssign(
        organizationId,
        product.id,
        {
          code_ids: codeIds,
          distributor_id: distributorId,
        },
      );

      const updatedById = new Map(
        result.items.map((item) => [item.id, item]),
      );

      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map(
                (item) => updatedById.get(item.id) ?? item,
              ),
            }
          : current,
      );

      const distributorName = distributorId
        ? distributors.find((item) => item.id === distributorId)?.name
        : null;

      setBulkNotice(
        distributorId
          ? `Assigned ${result.updated} ${
              result.updated === 1 ? "code" : "codes"
            } to ${distributorName ?? "the selected distributor"}.`
          : `Removed the distributor from ${result.updated} ${
              result.updated === 1 ? "code" : "codes"
            }.`,
      );
      setSelectedIds(new Set());
      setBulkDistributorId("");
    } catch (cause) {
      setUpdateError(
        cause instanceof ApiError
          ? cause.message
          : "We could not assign these codes. Please try again.",
      );
    } finally {
      setBulkAssigning(false);
    }
  }

  async function handleExport() {
    if (exporting) return;

    setExporting(true);
    setUpdateError(null);

    try {
      const blob = await verificationCodeApi.exportCsv(
        organizationId,
        product.id,
        { status: filter, search },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const safeSku =
        product.sku.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") ||
        "product";

      link.href = url;
      link.download = `verification-codes-${safeSku}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setUpdateError(
        cause instanceof ApiError
          ? cause.message
          : "We could not export these codes. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  const counts = data?.status_counts ?? {
    total: 0,
    unused: 0,
    verified: 0,
    used: 0,
    reported: 0,
  };
  const currentPage = data?.page ?? page;
  const pages = data?.pages ?? 1;
  const hasCodes = counts.total > 0;
  const pageCodes = data?.items ?? [];
  const allSelected =
    pageCodes.length > 0 &&
    pageCodes.every((code) => selectedIds.has(code.id));
  const someSelected = pageCodes.some((code) => selectedIds.has(code.id));
  const selectedPageIds = pageCodes
    .filter((code) => selectedIds.has(code.id))
    .map((code) => code.id);

  return (
    <>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
            Verification codes
          </h1>
          <p className="mt-1.5 max-w-[720px] break-words text-[15px] leading-6 text-dash-muted">
            {product.name} · {product.sku} · {organizationName}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row xl:mt-1 xl:w-auto">
          <Link
            href={`/dashboard/products/${product.id}`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-base font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:w-auto"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Product details
          </Link>
          <button
            type="button"
            onClick={() => setPurchaseOpen(true)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-base font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto"
          >
            Purchase codes
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section aria-labelledby="code-totals-heading" className="mt-7">
        <h2
          id="code-totals-heading"
          className="font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl xl:leading-7"
        >
          Code totals
        </h2>
        <p className="mt-1 text-sm leading-5 text-dash-muted">
          {product.latestBatch
            ? `Batch ${product.latestBatch} · Prefix ${manufacturerPrefix}`
            : `Prefix ${manufacturerPrefix} · No batch assigned`}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Total codes"
            value={counts.total}
            description="All codes generated"
          />
          <SummaryCard
            label="Unused"
            value={counts.unused}
            description="Ready to print or verify"
          />
          <SummaryCard
            label="Verified"
            value={counts.verified}
            description="Checked by a consumer"
          />
          <SummaryCard
            label="Used"
            value={counts.used}
            description="Applied to a product unit"
          />
          <SummaryCard
            label="Reported"
            value={counts.reported}
            description="Flagged for review"
          />
        </div>
      </section>

      <section
        aria-labelledby="all-codes-heading"
        className="mt-7 overflow-hidden rounded-xl border border-dash-line bg-white"
      >
        <div className="border-b border-dash-line px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="all-codes-heading"
                className="font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl xl:leading-7"
              >
                All verification codes
              </h2>
              <p className="mt-1 text-sm leading-5 text-dash-muted">
                {hasCodes
                  ? `${formatRequestedCodes(counts.total)} codes · Page ${currentPage} of ${pages}`
                  : "No codes have been generated for this product yet."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || !hasCodes}
                aria-busy={exporting || undefined}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-dash-muted transition-colors hover:border-line-strong hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exporting ? (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
                  />
                ) : (
                  <Download aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {exporting ? "Exporting…" : "Export CSV"}
              </button>

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

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div
              role="tablist"
              aria-label="Filter codes by status"
              className="flex flex-wrap gap-2"
            >
              {VERIFICATION_CODE_STATUS_OPTIONS.map((option) => {
                const count =
                  option.value === "all"
                    ? counts.total
                    : counts[option.value];

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={filter === option.value}
                    onClick={() => handleFilterChange(option.value)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                      filter === option.value
                        ? "border-brand bg-brand/5 text-brand-ink"
                        : "border-line bg-white text-dash-muted hover:border-line-strong hover:text-brand-ink",
                    )}
                  >
                    {option.label}
                    <span className="rounded bg-dash-soft px-1.5 py-0.5 text-[11px] leading-4 text-dash-muted">
                      {formatRequestedCodes(count)}
                    </span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleSearch}
              className="flex w-full items-center gap-2 xl:w-auto"
            >
              <label htmlFor="code-search" className="sr-only">
                Search by code
              </label>
              <div className="relative min-w-0 flex-1 xl:w-64">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dash-muted"
                />
                <input
                  id="code-search"
                  name="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search code"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-xs font-medium text-ink outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
              >
                Search
              </button>
            </form>
          </div>

          {canManage && selectedPageIds.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand/25 bg-brand/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold leading-5 text-brand-ink">
                {selectedPageIds.length}{" "}
                {selectedPageIds.length === 1 ? "code" : "codes"} selected
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="bulk-distributor" className="sr-only">
                  Distributor for selected codes
                </label>
                <select
                  id="bulk-distributor"
                  value={bulkDistributorId}
                  disabled={bulkAssigning}
                  onChange={(event) => {
                    setBulkDistributorId(event.target.value);
                    setBulkNotice(null);
                  }}
                  className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-brand-ink outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-wait disabled:opacity-60"
                >
                  <option value="">Select distributor</option>
                  {distributors.map((distributor) => (
                    <option key={distributor.id} value={distributor.id}>
                      {distributor.name}
                    </option>
                  ))}
                  <option value={BULK_UNASSIGNED}>Unassigned</option>
                </select>

                <button
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={!bulkDistributorId || bulkAssigning}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {bulkAssigning
                    ? bulkDistributorId === BULK_UNASSIGNED
                      ? "Removing…"
                      : "Assigning…"
                    : bulkDistributorId === BULK_UNASSIGNED
                      ? "Unassign"
                      : "Assign"}
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={bulkAssigning}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-white px-3 text-xs font-semibold text-dash-muted transition-colors hover:border-line-strong hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}

          {updateError ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error"
            >
              {updateError}
            </div>
          ) : null}

          {bulkNotice ? (
            <div
              role="status"
              className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-3.5 py-3 text-sm leading-5 text-brand-ink"
            >
              {bulkNotice}
            </div>
          ) : null}
        </div>

        {status === "loading" && !data ? (
          <div className="flex items-center gap-3 px-5 py-10 text-sm font-medium text-dash-muted sm:px-6">
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
            />
            Loading verification codes…
          </div>
        ) : status === "error" ? (
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
        ) : !data || data.items.length === 0 ? (
          <div className="flex items-start gap-3.5 px-5 py-8 sm:px-6">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
            >
              <Ticket className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-brand-ink">
                {hasCodes ? "No codes match this filter" : "No codes yet"}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-dash-muted">
                {hasCodes
                  ? "Try another status or clear the search."
                  : "Purchase verification codes to generate the first batch."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <caption className="sr-only">
                  Verification codes for {product.name}
                </caption>
                <thead>
                  <tr className="border-b border-dash-line">
                    <th
                      scope="col"
                      className="w-10 pb-3 pl-5 pr-0 pt-4 text-left sm:pl-6"
                    >
                      {canManage ? (
                        <SelectAllCheckbox
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          disabled={bulkAssigning || pageCodes.length === 0}
                          onChange={toggleAllCodes}
                        />
                      ) : (
                        <span className="sr-only">Select</span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-dash-muted"
                    >
                      Code
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-dash-muted"
                    >
                      Batch
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-dash-muted"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-dash-muted"
                    >
                      Distributor
                    </th>
                    <th
                      scope="col"
                      className="px-3 pb-3 pt-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-dash-muted"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-5 pb-3 pt-4 text-right text-xs font-semibold uppercase tracking-[0.06em] text-dash-muted sm:px-6"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((code) => (
                    <tr
                      key={code.id}
                      className="border-b border-dash-line last:border-b-0"
                    >
                      <td className="w-10 py-4 pl-5 pr-0 align-middle sm:pl-6">
                        {canManage ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(code.id)}
                            disabled={bulkAssigning}
                            onChange={(event) =>
                              toggleCodeSelection(
                                code.id,
                                event.target.checked,
                              )
                            }
                            aria-label={`Select ${code.code}`}
                            className="h-4 w-4 cursor-pointer rounded border-line accent-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        ) : null}
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <span className="font-mono text-sm font-semibold tracking-[0.04em] text-brand-ink">
                          {code.code}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-middle text-sm text-dash-muted">
                        {code.batch_no ?? "—"}
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <VerificationCodeStatusBadge status={code.status} />
                      </td>
                      <td className="px-3 py-4 align-middle">
                        {canManage ? (
                          <div className="flex flex-col gap-1">
                            <DistributorSelect
                              code={code}
                              distributors={distributors}
                              disabled={updatingId === code.id || bulkAssigning}
                              onChange={(nextDistributorId) =>
                                handleDistributorChange(
                                  code,
                                  nextDistributorId,
                                )
                              }
                            />
                            {distributorLocation(code) ? (
                              <span className="pl-0.5 text-[11px] leading-4 text-dash-muted">
                                {distributorLocation(code)}
                              </span>
                            ) : null}
                          </div>
                        ) : code.distributor ? (
                          <>
                            <p className="text-sm leading-5 text-brand-ink">
                              {code.distributor.name}
                            </p>
                            {distributorLocation(code) ? (
                              <p className="mt-0.5 text-[11px] leading-4 text-dash-muted">
                                {distributorLocation(code)}
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-xs text-dash-muted">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <p className="text-sm leading-5 text-brand-ink">
                          {formatDateTime(code.created_at)}
                        </p>
                        {code.status_changed_at ? (
                          <p className="mt-0.5 text-[11px] leading-4 text-dash-muted">
                            Updated {formatDateTime(code.status_changed_at)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right align-middle sm:px-6">
                        {canManage ? (
                          <StatusSelect
                            code={code}
                            disabled={updatingId === code.id || bulkAssigning}
                            onChange={(nextStatus) =>
                              handleStatusChange(code, nextStatus)
                            }
                          />
                        ) : (
                          <span className="text-xs text-dash-muted">
                            Owner/Admin only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-dash-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs leading-5 text-dash-muted">
                Showing{" "}
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, data.total)} of{" "}
                {formatRequestedCodes(data.total)} codes
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changePage(Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage <= 1}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-brand-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs font-semibold text-dash-muted">
                  {currentPage} / {pages}
                </span>
                <button
                  type="button"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage >= pages}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-brand-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-dash-line bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
          >
            <QrCode className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-5 text-brand-ink">
              About these codes
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-dash-muted">
              Codes are unique and generated from your manufacturer prefix.
              Assign each code to the distributor that receives it so consumer
              checks can show where the product came from. Export the filtered
              list as a CSV for printing or record keeping. Status changes are
              recorded for this demo; consumer verification and reporting will
              update them automatically later.
            </p>
            <p className="mt-2 text-[13px] leading-5 text-dash-muted">
              Unit price: {formatKobo(1_000)} per code · Service charge:{" "}
              {formatKobo(5_000)} per order.
            </p>
          </div>
        </div>
      </section>

      {purchaseOpen ? (
        <PurchaseCodesDialog
          organizationId={organizationId}
          productId={product.id}
          productName={product.name}
          batchNo={product.latestBatch}
          manufacturerPrefix={manufacturerPrefix}
          onClose={() => setPurchaseOpen(false)}
          onPurchased={() => setReloadKey((current) => current + 1)}
        />
      ) : null}
    </>
  );
}
