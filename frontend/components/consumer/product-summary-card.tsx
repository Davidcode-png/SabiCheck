import { ImageOff } from "lucide-react";

import type { PublicProduct } from "@/lib/api/public-code";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm leading-5 text-muted">{label}</dt>
      <dd className="max-w-[62%] break-words text-right text-sm font-semibold leading-5 text-brand-ink">
        {value}
      </dd>
    </div>
  );
}

function ProductThumb({ product }: { product: PublicProduct }) {
  if (product.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image_url}
        alt={`${product.name} product`}
        className="h-20 w-20 shrink-0 rounded-xl border border-line bg-canvas object-cover"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong bg-canvas/60">
      <ImageOff
        aria-hidden="true"
        className="h-5 w-5 text-muted"
        strokeWidth={1.7}
      />
    </div>
  );
}

export function ProductSummaryCard({
  product,
  code,
}: {
  product: PublicProduct | null;
  code: string;
}) {
  if (!product) return null;

  const packDetails =
    product.pack_size ?? product.packaging_type ?? product.unit ?? null;
  const distributorLocation = product.distributor
    ? [product.distributor.city, product.distributor.state]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(", ")
    : "";

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex gap-4">
        <ProductThumb product={product} />

        <div className="min-w-0 flex-1 pt-0.5">
          {product.brand_name ? (
            <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.1em] text-muted">
              {product.brand_name}
            </p>
          ) : null}
          <p className="mt-1 font-display text-lg font-bold leading-6 text-brand-ink">
            {product.name}
          </p>
          {packDetails ? (
            <p className="mt-1 text-sm leading-5 text-muted">{packDetails}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 divide-y divide-line border-t border-line pt-1">
        <DetailRow label="Manufacturer" value={product.manufacturer_name} />
        {product.batch_no ? (
          <DetailRow label="Batch" value={product.batch_no} />
        ) : null}
        {product.distributor ? (
          <DetailRow label="Distributor" value={product.distributor.name} />
        ) : null}
        {distributorLocation ? (
          <DetailRow label="Location" value={distributorLocation} />
        ) : null}
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#f1f6f3] px-3 py-2.5">
        <span className="text-xs font-medium leading-4 text-muted">Code</span>
        <span className="break-all font-mono text-sm font-bold tracking-[0.04em] text-brand-ink">
          {code}
        </span>
      </div>
    </div>
  );
}
