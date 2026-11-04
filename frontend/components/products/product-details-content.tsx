"use client";

import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Download,
  ImageOff,
  Trash2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  ProductActionDialog,
  type ProductActionDialogContent,
} from "@/components/products/product-action-dialog";
import { ProductDeleteDialog } from "@/components/products/product-delete-dialog";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { PurchaseCodesDialog } from "@/components/products/purchase-codes-dialog";
import { productApi } from "@/lib/api/products";
import {
  verificationCodeApi,
  type VerificationCodeOrder,
  type VerificationCodeSummary,
} from "@/lib/api/verification-codes";
import {
  formatRequestedCodes,
  type RegistryProduct,
} from "@/lib/product-registry";
import {
  formatDetailsAsOf,
  type ProductCodeTotals,
  type ProductDistributionMovement,
  type ProductOrderBatch,
} from "@/lib/product-details";

const darkButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-base font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:pointer-events-none disabled:opacity-50";

const downloadButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold leading-5 text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:pointer-events-none disabled:opacity-50";

const sectionHeadingClassName =
  "font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl xl:leading-7";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium leading-5 text-dash-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-base font-semibold leading-6 text-brand-ink">
        {value}
      </dd>
    </div>
  );
}

function ProductImage({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} product image`}
        className="h-28 w-28 shrink-0 rounded-xl border border-dash-line bg-canvas object-cover sm:h-32 sm:w-32"
      />
    );
  }

  return (
    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-dash-line bg-canvas/40 px-2 text-center sm:h-32 sm:w-32">
      <ImageOff
        aria-hidden="true"
        className="h-5 w-5 text-dash-muted"
        strokeWidth={1.7}
      />
      <span className="text-[11px] leading-4 text-dash-muted">
        No image uploaded
      </span>
    </div>
  );
}

function CodeTotalCard({
  label,
  value,
  description,
  action,
}: {
  label: string;
  value: number;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-dash-line bg-white p-5">
      <p className="text-sm font-medium leading-5 text-dash-muted">{label}</p>
      <p className="mt-2 font-display text-[32px] font-bold leading-10 text-brand-ink">
        {formatRequestedCodes(value)}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-dash-muted">
        {description}
      </p>
      {action ? <div className="mt-auto pt-5">{action}</div> : null}
    </div>
  );
}

function BatchField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm leading-5 text-dash-muted">{label}</p>
      <p className="mt-0.5 break-words text-base font-semibold leading-6 text-brand-ink">
        {value}
      </p>
    </div>
  );
}

function OrderBatchRow({ batch }: { batch: ProductOrderBatch }) {
  return (
    <li className="border-t border-dash-line px-5 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_repeat(4,minmax(0,1fr))] xl:items-center xl:gap-x-6">
        <h3 className="font-display text-base font-bold uppercase leading-6 tracking-[0.01em] text-brand-ink sm:col-span-2 xl:col-span-1">
          {batch.label}
        </h3>
        <BatchField label="Code Order ID" value={batch.codeOrderId} />
        <BatchField label="Production date" value={batch.productionDate} />
        <BatchField
          label="Cumulative code requests"
          value={`${formatRequestedCodes(batch.codeRequests)} unit codes`}
        />
        <BatchField
          label="Expected release quantity"
          value={`${formatRequestedCodes(batch.expectedRelease)} physical units`}
        />
      </div>
    </li>
  );
}

function DistributionCard({
  movement,
}: {
  movement: ProductDistributionMovement;
}) {
  return (
    <li className="border-t border-dash-line px-5 py-5 sm:px-6">
      <p className="text-sm leading-5 text-dash-muted">
        {movement.reference}
      </p>
      <p className="mt-1 text-base font-semibold leading-6 text-brand-ink">
        {movement.date}
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-sm leading-5 text-dash-muted">
            Authorised distributor
          </dt>
          <dd className="mt-1 break-words text-base font-semibold leading-6 text-brand-ink">
            {movement.distributor}
            <span className="mt-0.5 block text-sm font-normal leading-5 text-dash-muted">
              {movement.location}
            </span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm leading-5 text-dash-muted">Units moved</dt>
          <dd className="mt-1 break-words text-base font-semibold leading-6 text-brand-ink">
            {formatRequestedCodes(movement.unitsMoved)} physical units
          </dd>
        </div>
      </dl>
    </li>
  );
}

function EmptySection({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3.5 border-t border-dash-line px-5 py-6 sm:px-6">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
      >
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-brand-ink">{title}</p>
        <p className="mt-1 text-[13px] leading-5 text-dash-muted">{body}</p>
      </div>
    </div>
  );
}

function UnitCodeTotals({
  totals,
  onDownload,
}: {
  totals: ProductCodeTotals;
  onDownload: () => void;
}) {
  const hasCodes = totals.unused > 0;

  return (
    <section aria-labelledby="unit-code-totals-heading" className="mt-7">
      <h2 id="unit-code-totals-heading" className={sectionHeadingClassName}>
        Unit-code totals
      </h2>
      <p className="mt-1 text-sm leading-5 text-dash-muted">
        {totals.batchReference
          ? `All totals relate to batch ${totals.batchReference} · As of ${totals.asOf}`
          : "No unit codes have been ordered for this product yet."}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <CodeTotalCard
          label="Purchased"
          value={totals.purchased}
          description={totals.purchaseDescription}
        />
        <CodeTotalCard
          label="Printed/Used"
          value={totals.printed}
          description={totals.printedDescription}
        />
        <CodeTotalCard
          label="Unused"
          value={totals.unused}
          description={totals.unusedDescription}
          action={
            <button
              type="button"
              onClick={onDownload}
              disabled={!hasCodes}
              aria-label={
                hasCodes
                  ? "Download print-ready UVCs/QR codes"
                  : "Download print-ready UVCs/QR codes (no codes available)"
              }
              className={downloadButtonClassName}
            >
              Download print-ready UVCs/QR codes
              <Download aria-hidden="true" className="h-4 w-4" />
            </button>
          }
        />
      </div>
    </section>
  );
}

export function ProductDetailsContent({
  product,
  organizationId,
  organizationName,
  manufacturerPrefix,
}: {
  product: RegistryProduct;
  organizationId: string;
  organizationName: string;
  manufacturerPrefix: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<ProductActionDialogContent>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [summary, setSummary] = useState<VerificationCodeSummary | null>(null);
  const [orders, setOrders] = useState<VerificationCodeOrder[]>([]);
  const [codeDataError, setCodeDataError] = useState<string | null>(null);
  const [codeDataLoading, setCodeDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setCodeDataLoading(true);
      setCodeDataError(null);

      try {
        const [nextSummary, nextOrders] = await Promise.all([
          verificationCodeApi.summary(organizationId, product.id),
          verificationCodeApi.orders(organizationId, product.id),
        ]);
        if (cancelled) return;

        setSummary(nextSummary);
        setOrders(nextOrders);
      } catch {
        if (cancelled) return;

        setCodeDataError(
          "Code totals could not be loaded. The product details are still available.",
        );
      } finally {
        if (!cancelled) setCodeDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, product.id, refreshKey]);

  const codeTotals: ProductCodeTotals = summary
    ? {
        purchased: summary.total,
        printed: summary.used,
        unused: summary.unused,
        purchaseDescription:
          summary.total > 0
            ? "Cumulative across all code orders"
            : "No codes purchased yet",
        printedDescription:
          summary.used > 0 ? "Marked as used" : "No used codes yet",
        unusedDescription:
          summary.unused > 0 ? "Ready to print" : "No unused codes available",
        batchReference: summary.batch_no,
        asOf: formatDetailsAsOf(new Date()),
      }
    : {
        purchased: 0,
        printed: 0,
        unused: 0,
        purchaseDescription: codeDataLoading
          ? "Loading code totals…"
          : "No codes purchased yet",
        printedDescription: "No used codes yet",
        unusedDescription: "No unused codes available",
        batchReference: product.latestBatch,
        asOf: formatDetailsAsOf(new Date()),
      };

  const orderBatches: ProductOrderBatch[] = orders.map((order) => ({
    id: order.id,
    label: order.batch_no ?? "Batch",
    codeOrderId: order.reference,
    productionDate: formatDetailsAsOf(new Date(order.created_at)),
    codeRequests: order.quantity,
    expectedRelease: order.quantity,
  }));

  const distribution: ProductDistributionMovement[] = [];

  const description =
    product.description?.trim() || "No product description provided.";

  async function handleDelete() {
    await productApi.remove(organizationId, product.id);
    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
            {product.name}
          </h1>
          <p className="mt-1.5 max-w-[720px] break-words text-[15px] leading-6 text-dash-muted">
            Catalogue product · {product.sku} · {organizationName}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row xl:mt-1 xl:w-auto">
          <Link
            href={`/dashboard/products/${product.id}/codes`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-base font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:w-auto"
          >
            View all codes
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setPurchaseOpen(true)}
            className={`${darkButtonClassName} w-full shrink-0 sm:w-auto`}
          >
            Purchase verification codes
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link
        href="/dashboard/products"
        className="mt-6 inline-flex items-center gap-2 rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to product registry
      </Link>

      <section
        aria-labelledby="product-information-heading"
        className="mt-7 rounded-xl border border-dash-line bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="product-information-heading"
              className={sectionHeadingClassName}
            >
              Product information
            </h2>
            <div className="mt-3">
              <ProductStatusBadge status={product.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() =>
                setAction({
                  title: "Edit product",
                  body: "Editing catalogue records isn't available yet. Delete and re-register the product if you need to change its details.",
                })
              }
              className="rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              Edit product
            </button>

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-error transition-colors hover:text-error/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/20"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete product
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProductImage src={product.imageUrl ?? null} name={product.name} />

          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="SKU / product identifier" value={product.sku} />
            <InfoItem label="Category" value={product.category} />
            <InfoItem
              label="Brand name"
              value={product.brandName?.trim() || "Not specified"}
            />
            <InfoItem label="Pack size" value={product.packSize} />
            <InfoItem
              label="Packaging type"
              value={product.packagingType?.trim() || "Not specified"}
            />
            <InfoItem
              label="Batch no"
              value={product.latestBatch?.trim() || "Not assigned"}
            />
            <InfoItem
              label="NAFDAC registration no"
              value={product.nafdacRegistrationNo?.trim() || "Not specified"}
            />
            <InfoItem
              label="Barcode"
              value={product.barcode?.trim() || "Not provided"}
            />
          </dl>
        </div>

        <div className="mt-6 border-t border-dash-line pt-5">
          <h3 className="text-sm font-semibold leading-5 text-brand-ink">
            Description
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-brand-ink/80">
            {description}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-dash-muted">
            Registered {product.dateAdded}.
          </p>
        </div>
      </section>

      {codeDataError ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error"
        >
          {codeDataError}
        </div>
      ) : null}

      <UnitCodeTotals
        totals={codeTotals}
        onDownload={() =>
          setAction({
            title: "Download verification codes",
            body: "Open the verification codes page to review every generated code. Print-ready exports will be added there next.",
          })
        }
      />

      <div className="mt-4">
        <Link
          href={`/dashboard/products/${product.id}/codes`}
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          View all verification codes
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      <section
        aria-labelledby="order-batches-heading"
        className="mt-7 overflow-hidden rounded-xl border border-dash-line bg-white"
      >
        <div className="px-5 py-5 sm:px-6">
          <h2 id="order-batches-heading" className={sectionHeadingClassName}>
            Order batches
          </h2>
        </div>

        {orderBatches.length > 0 ? (
          <ul>
            {orderBatches.map((batch) => (
              <OrderBatchRow key={batch.id} batch={batch} />
            ))}
          </ul>
        ) : (
          <EmptySection
            icon={Boxes}
            title="No order batches yet"
            body="Register a batch and order unit codes to see them here."
          />
        )}
      </section>

      <section
        aria-labelledby="distribution-history-heading"
        className="mt-7 rounded-xl border border-dash-line bg-white"
      >
        <div className="px-5 pt-5 sm:px-6">
          <h2
            id="distribution-history-heading"
            className={sectionHeadingClassName}
          >
            Distribution history
          </h2>
          <p className="mt-1 text-sm leading-5 text-dash-muted">
            {product.latestBatch
              ? `Recorded movements · Batch ${product.latestBatch} · Illustrative records`
              : "Recorded movements · Illustrative records"}
          </p>
        </div>

        {distribution.length > 0 ? (
          <>
            <table className="mt-5 hidden w-full border-collapse text-left xl:table">
              <caption className="sr-only">
                Distribution movements recorded for {product.name}
              </caption>
              <thead>
                <tr className="border-b border-dash-line">
                  <th
                    scope="col"
                    className="px-3 pb-3 pt-1 text-left text-sm font-semibold text-dash-muted first:pl-6 last:pr-6"
                  >
                    Recorded date / reference
                  </th>
                  <th
                    scope="col"
                    className="px-3 pb-3 pt-1 text-left text-sm font-semibold text-dash-muted first:pl-6 last:pr-6"
                  >
                    Authorised distributor
                  </th>
                  <th
                    scope="col"
                    className="px-3 pb-3 pt-1 text-left text-sm font-semibold text-dash-muted first:pl-6 last:pr-6"
                  >
                    Units moved
                  </th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b border-dash-line last:border-b-0"
                  >
                    <td className="px-3 py-4 align-top first:pl-6 last:pr-6">
                      <p className="text-sm leading-5 text-dash-muted">
                        {movement.reference}
                      </p>
                      <p className="mt-1 text-base font-semibold leading-6 text-brand-ink">
                        {movement.date}
                      </p>
                    </td>
                    <td className="px-3 py-4 align-top first:pl-6 last:pr-6">
                      <p className="text-sm leading-5 text-dash-muted">
                        {movement.location}
                      </p>
                      <p className="mt-1 text-base font-semibold leading-6 text-brand-ink">
                        {movement.distributor}
                      </p>
                    </td>
                    <td className="px-3 py-4 align-top first:pl-6 last:pr-6">
                      <p className="text-sm leading-5 text-dash-muted">
                        Physical units moved
                      </p>
                      <p className="mt-1 text-base font-semibold leading-6 text-brand-ink">
                        {formatRequestedCodes(movement.unitsMoved)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="mt-5 xl:hidden">
              {distribution.map((movement) => (
                <DistributionCard key={movement.id} movement={movement} />
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-5">
            <EmptySection
              icon={Truck}
              title="No distribution records yet"
              body="Movements will appear here when distributors record them."
            />
          </div>
        )}

        <p className="mx-5 mt-4 text-[13px] leading-5 text-dash-muted sm:mx-6">
          Movement records are not proof of authenticity or distributor
          responsibility. A missing movement record means no movement was
          recorded, not that no distribution occurred.
        </p>

        <Link
          href="/dashboard#distribution"
          className="mx-5 mb-5 mt-5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:mx-6"
        >
          View distribution records
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      {purchaseOpen ? (
        <PurchaseCodesDialog
          organizationId={organizationId}
          productId={product.id}
          productName={product.name}
          batchNo={product.latestBatch}
          manufacturerPrefix={manufacturerPrefix}
          onClose={() => setPurchaseOpen(false)}
          onPurchased={() => setRefreshKey((current) => current + 1)}
        />
      ) : null}

      <ProductActionDialog content={action} onClose={() => setAction(null)} />
      {deleteOpen ? (
        <ProductDeleteDialog
          productName={product.name}
          onClose={() => setDeleteOpen(false)}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  );
}
