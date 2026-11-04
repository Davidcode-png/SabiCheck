"use client";

import { ArrowLeft, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardBreadcrumbItem } from "@/components/dashboard/dashboard-topbar";
import { MobileDashboardHeader } from "@/components/dashboard/mobile-dashboard-header";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { ProductDetailsContent } from "@/components/products/product-details-content";
import { ApiError } from "@/lib/api/client";
import { productApi } from "@/lib/api/products";
import { toRegistryProduct, type RegistryProduct } from "@/lib/product-registry";

type LoadStatus = "loading" | "ready" | "error";

type ProductData = {
  organizationId: string | null;
  productId: string | null;
  reloadKey: number;
  product: RegistryProduct | null;
  notFound: boolean;
  error: string | null;
};

function ProductDetailsLoading() {
  return (
    <section
      aria-busy="true"
      className="rounded-xl border border-dash-line bg-white p-6 sm:p-8"
    >
      <p
        role="status"
        className="flex items-center gap-3 text-sm font-medium text-dash-muted"
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
        />
        Loading product details…
      </p>
    </section>
  );
}

function ProductNotFound({ organizationName }: { organizationName: string }) {
  return (
    <section className="rounded-xl border border-dash-line bg-white p-5 sm:p-8">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dash-soft text-brand-ink"
      >
        <PackageSearch className="h-6 w-6" strokeWidth={1.7} />
      </span>

      <h1 className="mt-4 font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
        Product not found
      </h1>
      <p className="mt-2 max-w-[620px] text-sm leading-6 text-dash-muted">
        We couldn&apos;t find a product with that identifier in{" "}
        {organizationName}&apos;s registry. It may have been removed, or the
        link may be out of date.
      </p>

      <Link
        href="/dashboard/products"
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-base font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to product registry
      </Link>
    </section>
  );
}

function ProductLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-dash-line bg-white p-5 sm:p-8"
    >
      <h1 className="font-display text-[24px] font-bold leading-8 text-brand-ink">
        Product details could not be loaded
      </h1>
      <p className="mt-2 max-w-[620px] text-sm leading-6 text-dash-muted">
        {message}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-ink px-5 text-base font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto"
        >
          Try again
        </button>
        <Link
          href="/dashboard/products"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-base font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:w-auto"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to product registry
        </Link>
      </div>
    </section>
  );
}

export function ProductDetailsScreen({ id }: { id: string }) {
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [data, setData] = useState<ProductData>({
    organizationId: null,
    productId: null,
    reloadKey: 0,
    product: null,
    notFound: false,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedOrganizationId) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await productApi.get(selectedOrganizationId, id);
        if (cancelled) return;

        setData({
          organizationId: selectedOrganizationId,
          productId: id,
          reloadKey,
          product: toRegistryProduct(result),
          notFound: false,
          error: null,
        });
      } catch (cause) {
        if (cancelled) return;

        if (cause instanceof ApiError && cause.status === 404) {
          setData({
            organizationId: selectedOrganizationId,
            productId: id,
            reloadKey,
            product: null,
            notFound: true,
            error: null,
          });
          return;
        }

        setData({
          organizationId: selectedOrganizationId,
          productId: id,
          reloadKey,
          product: null,
          notFound: false,
          error:
            cause instanceof ApiError
              ? cause.message
              : "We could not load this product. Please try again.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId, id, reloadKey]);

  const isCurrent =
    data.organizationId === selectedOrganizationId &&
    data.productId === id &&
    data.reloadKey === reloadKey;
  const status: LoadStatus = !selectedOrganizationId
    ? "ready"
    : !isCurrent
      ? "loading"
      : data.error
        ? "error"
        : "ready";
  const product = isCurrent ? data.product : null;
  const error = data.error;

  const organizationName = selectedOrganization?.name ?? "your organization";
  const manufacturerPrefix =
    selectedOrganization?.manufacturer_prefix ?? "ORG";

  const breadcrumb = useMemo<ReadonlyArray<DashboardBreadcrumbItem>>(
    () => [
      { label: "Workspace", href: "/dashboard" },
      { label: "Products & codes", href: "/dashboard/products" },
      { label: product?.sku ?? "Product details" },
    ],
    [product],
  );

  return (
    <div className="min-h-dvh bg-dash-canvas">
      <DashboardSidebar />
      <MobileDashboardHeader sectionLabel="Products & codes" />

      <div className="xl:pl-[247px]">
        <DashboardTopbar breadcrumb={breadcrumb} />

        <main className="px-5 pb-8 pt-7 sm:px-8 xl:px-10 xl:pt-8">
          <div className="min-w-0">
            {status === "loading" ? (
              <ProductDetailsLoading />
            ) : status === "error" ? (
              <ProductLoadError
                message={
                  error ?? "We could not load this product. Please try again."
                }
                onRetry={() => setReloadKey((current) => current + 1)}
              />
            ) : product && selectedOrganizationId ? (
              <ProductDetailsContent
                product={product}
                organizationId={selectedOrganizationId}
                organizationName={organizationName}
                manufacturerPrefix={manufacturerPrefix}
              />
            ) : (
              <ProductNotFound organizationName={organizationName} />
            )}

            <footer className="mt-8 pb-2 text-xs leading-5 text-dash-muted xl:mt-9">
              SabiCheck · Manufacturer workspace · Dates and times use WAT
              (UTC+1).
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
