"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  PackageSearch,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/lib/api/client";
import { productApi } from "@/lib/api/products";
import { cn } from "@/lib/cn";
import {
  PRODUCT_STATUS_FILTER_OPTIONS,
  REGISTRY_PAGE_SIZE,
  formatRequestedCodes,
  getRegistryStats,
  productCategoryOptions,
  toRegistryProduct,
  type ProductStatusFilter,
  type RegistryProduct,
} from "@/lib/product-registry";

type SortDirection = "asc" | "desc";

const tableHeadClassName =
  "px-3 py-3 text-left text-[10px] font-bold uppercase leading-4 tracking-[0.05em] text-dash-muted";
const tableCellClassName =
  "px-3 py-4 align-middle text-[13px] leading-5 text-brand-ink";

function productCountLabel(count: number) {
  return `${formatRequestedCodes(count)} ${
    count === 1 ? "product" : "products"
  }`;
}

function batchCountLabel(count: number) {
  return `${formatRequestedCodes(count)} ${count === 1 ? "batch" : "batches"}`;
}

function RegistryStatCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dash-line bg-white p-4 sm:p-5",
        className,
      )}
    >
      <p className="text-[12px] font-semibold leading-5 text-dash-muted sm:text-[13px]">
        {label}
      </p>
      <p className="mt-1.5 font-display text-[28px] font-bold leading-9 text-brand-ink xl:text-[32px] xl:leading-10">
        {value}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-dash-muted xl:text-[13px]">
        {description}
      </p>
    </div>
  );
}

function RegistryStats({
  products,
}: {
  products: ReadonlyArray<RegistryProduct>;
}) {
  const stats = getRegistryStats(products);

  return (
    <section aria-labelledby="registry-summary-heading" className="mt-6 xl:mt-7">
      <h2 id="registry-summary-heading" className="sr-only">
        Product summary
      </h2>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <RegistryStatCard
          label="Total products"
          value={formatRequestedCodes(stats.totalProducts)}
          description="Registered once"
        />
        <RegistryStatCard
          label="Batches"
          value={formatRequestedCodes(stats.totalBatches)}
          description="Separate release records"
          className="xl:hidden"
        />
        <RegistryStatCard
          label="Verified products"
          value={formatRequestedCodes(stats.verifiedProducts)}
          description="Products approved for UVCs"
          className="hidden xl:block"
        />
        <RegistryStatCard
          label="Pending review"
          value={formatRequestedCodes(stats.pendingReview)}
          description="Product registration or NAFDAC details await verification."
          className="hidden xl:block"
        />
        <RegistryStatCard
          label="Total codes requested"
          value={formatRequestedCodes(stats.totalCodes)}
          description="Linked to a registered batch"
          className="hidden xl:block"
        />
      </div>
    </section>
  );
}

function EmptyRegistry({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-dash-soft text-brand-ink"
      >
        <PackageSearch className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-sm font-semibold leading-5 text-brand-ink">
        {hasFilters ? "No products match your filters." : "No products yet."}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-dash-muted">
        {hasFilters
          ? "Try a different search term, category or status."
          : "Register your first product to start tracking batches and codes."}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-dash-line bg-white px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/dashboard/products/register"
          className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        >
          Register product
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function RegistryLoading() {
  return (
    <section
      aria-busy="true"
      aria-labelledby="registry-loading-heading"
      className="mt-6 rounded-2xl border border-dash-line bg-white p-6 sm:p-8 xl:mt-7"
    >
      <h2 id="registry-loading-heading" className="sr-only">
        Product registry
      </h2>
      <p
        role="status"
        className="flex items-center gap-3 text-sm font-medium text-dash-muted"
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
        />
        Loading products…
      </p>
    </section>
  );
}

function RegistryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      role="alert"
      className="mt-6 rounded-2xl border border-dash-line bg-white p-6 sm:p-8 xl:mt-7"
    >
      <h2 className="font-display text-lg font-bold leading-6 text-brand-ink">
        Products could not be loaded
      </h2>
      <p className="mt-2 max-w-[560px] text-sm leading-6 text-dash-muted">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-dash-line bg-white px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      >
        Try again
      </button>
    </section>
  );
}

type RegistryData = {
  organizationId: string | null;
  reloadKey: number;
  products: RegistryProduct[];
  error: string | null;
};

export function ProductRegistry() {
  const { selectedOrganizationId } = useOrganizations();
  const [data, setData] = useState<RegistryData>({
    organizationId: null,
    reloadKey: 0,
    products: [],
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<ProductStatusFilter>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await productApi.list(selectedOrganizationId);
        if (cancelled) return;

        setData({
          organizationId: selectedOrganizationId,
          reloadKey,
          products: result.map(toRegistryProduct),
          error: null,
        });
      } catch (cause) {
        if (cancelled) return;

        setData({
          organizationId: selectedOrganizationId,
          reloadKey,
          products: [],
          error:
            cause instanceof ApiError
              ? cause.message
              : "We could not load your products. Please try again.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId, reloadKey]);

  const isCurrent =
    data.organizationId === selectedOrganizationId &&
    data.reloadKey === reloadKey;
  const loadStatus = !selectedOrganizationId
    ? "ready"
    : !isCurrent
      ? "loading"
      : data.error
        ? "error"
        : "ready";
  const products = useMemo(
    () => (isCurrent ? data.products : []),
    [isCurrent, data.products],
  );
  const loadError = data.error;

  const categories = useMemo(() => productCategoryOptions(products), [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query);
        const matchesCategory =
          category === "all" || product.category === category;
        const matchesStatus = status === "all" || product.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const result = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? result : -result;
      });
  }, [products, search, category, status, sortDirection]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / REGISTRY_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * REGISTRY_PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(
    pageStart,
    pageStart + REGISTRY_PAGE_SIZE,
  );
  const rangeStart = filteredProducts.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(
    pageStart + REGISTRY_PAGE_SIZE,
    filteredProducts.length,
  );
  const hasFilters =
    search.trim().length > 0 || category !== "all" || status !== "all";

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setPage(1);
  }

  function toggleSort() {
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  if (loadStatus === "loading") {
    return <RegistryLoading />;
  }

  if (loadStatus === "error") {
    return (
      <RegistryError
        message={loadError ?? "We could not load your products."}
        onRetry={() => setReloadKey((current) => current + 1)}
      />
    );
  }

  return (
    <>
      <RegistryStats products={products} />

      <section aria-labelledby="registry-list-heading" className="mt-6">
        <h2 id="registry-list-heading" className="sr-only">
          Product registry
        </h2>

        <div className="overflow-hidden rounded-2xl border border-dash-line bg-white">
          <div className="border-b border-dash-line px-5 py-5 sm:px-6">
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <TextField
                id="registry-search"
                label="Search products"
                type="search"
                icon={Search}
                placeholder="Search by product name or SKU"
                autoComplete="off"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />

              <SelectField
                id="registry-category"
                label="Category"
                options={categories}
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              />

              <SelectField
                id="registry-status"
                label="Status"
                options={PRODUCT_STATUS_FILTER_OPTIONS}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as ProductStatusFilter);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dash-line bg-dash-canvas/60 px-5 py-3 sm:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-5 text-dash-muted">
              <p aria-live="polite">
                {productCountLabel(filteredProducts.length)}
              </p>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={toggleSort}
                aria-label={`Sorted by product name, ${
                  sortDirection === "asc" ? "ascending" : "descending"
                }. Change to ${
                  sortDirection === "asc" ? "descending" : "ascending"
                }.`}
                className="inline-flex items-center gap-1 rounded font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              >
                Sorted by product name
                {sortDirection === "asc" ? (
                  <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded text-xs font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          {visibleProducts.length === 0 ? (
            <EmptyRegistry onClear={clearFilters} hasFilters={hasFilters} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full table-auto border-collapse text-left">
                  <caption className="sr-only">
                    Registered products, sorted by product name
                  </caption>
                  <thead>
                    <tr className="border-b border-dash-line bg-dash-canvas/60">
                      <th
                        scope="col"
                        aria-sort={
                          sortDirection === "asc" ? "ascending" : "descending"
                        }
                        className={cn(tableHeadClassName, "pl-5")}
                      >
                        Product name
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        SKU
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        Category
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        Pack size
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        Batches
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        Total codes requested
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        Status
                      </th>
                      <th scope="col" className={tableHeadClassName}>
                        Date added
                      </th>
                      <th
                        scope="col"
                        className={cn(tableHeadClassName, "pr-5 text-right")}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-dash-line last:border-b-0 hover:bg-dash-canvas/40"
                      >
                        <td className={cn(tableCellClassName, "pl-5")}>
                          <p className="text-sm font-semibold leading-5 text-brand-ink">
                            {product.name}
                          </p>
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap",
                          )}
                        >
                          {product.sku}
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap",
                          )}
                        >
                          {product.category}
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap",
                          )}
                        >
                          {product.packSize}
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap",
                          )}
                        >
                          {formatRequestedCodes(product.batches)}
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap",
                          )}
                        >
                          {formatRequestedCodes(product.codesRequested)}
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap",
                          )}
                        >
                          <ProductStatusBadge status={product.status} />
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "whitespace-nowrap text-dash-muted",
                          )}
                        >
                          {product.dateAdded}
                        </td>
                        <td
                          className={cn(
                            tableCellClassName,
                            "pr-5 text-right",
                          )}
                        >
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            aria-label={`View ${product.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                          >
                            <ArrowUpRight
                              aria-hidden="true"
                              className="h-4 w-4"
                            />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <ul className="divide-y divide-dash-line xl:hidden">
                {visibleProducts.map((product) => (
                  <li key={product.id} className="px-5 py-5 sm:px-6">
                    <h3 className="text-base font-semibold leading-6 text-brand-ink">
                      {product.name}
                    </h3>

                    <div className="mt-2">
                      <ProductStatusBadge status={product.status} />
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <dt className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.06em] text-dash-muted">
                          SKU
                        </dt>
                        <dd className="mt-1 text-sm font-semibold leading-5 text-brand-ink">
                          {product.sku}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.06em] text-dash-muted">
                          Category
                        </dt>
                        <dd className="mt-1 text-sm font-semibold leading-5 text-brand-ink">
                          {product.category}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.06em] text-dash-muted">
                          Pack size
                        </dt>
                        <dd className="mt-1 text-sm font-semibold leading-5 text-brand-ink">
                          {product.packSize}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.06em] text-dash-muted">
                          Batches
                        </dt>
                        <dd className="mt-1 text-sm font-semibold leading-5 text-brand-ink">
                          {batchCountLabel(product.batches)}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-4 text-xs leading-5 text-dash-muted">
                      {product.latestBatch
                        ? `Latest · ${product.latestBatch}`
                        : "No batch registered yet"}
                    </p>

                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                    >
                      View product
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2 border-t border-dash-line px-5 py-4 text-xs leading-5 text-dash-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                  Showing {rangeStart}–{rangeEnd} of {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "product" : "products"}
                </p>

                <div className="flex items-center gap-2">
                  {pageCount > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded px-2 py-0.5 font-semibold text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Previous
                    </button>
                  ) : null}

                  <p>
                    Page {currentPage} of {pageCount}
                  </p>

                  {pageCount > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPage(Math.min(pageCount, currentPage + 1))
                      }
                      disabled={currentPage === pageCount}
                      className="rounded px-2 py-0.5 font-semibold text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Next
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
