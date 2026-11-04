import type { Product } from "@/lib/api/products";

export type ProductStatus = "registered" | "verified" | "pending-review";

export type ProductStatusFilter = "all" | ProductStatus;

export type RegistryProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  packSize: string;
  packSizeValue?: string | null;
  unit?: string | null;
  batches: number;
  latestBatch: string | null;
  codesRequested: number;
  status: ProductStatus;
  dateAdded: string;
  packagingType?: string;
  description?: string;
  brandName?: string;
  nafdacRegistrationNo?: string;
  barcode?: string;
  imageUrl?: string | null;
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  registered: "Registered",
  verified: "Verified",
  "pending-review": "Pending review",
};

export const PRODUCT_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: ProductStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "registered", label: "Registered" },
  { value: "verified", label: "Verified" },
  { value: "pending-review", label: "Pending review" },
];

export const REGISTRY_PAGE_SIZE = 10;

export function formatRequestedCodes(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatRegistryDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function combinePackSize(packSize: string, unit: string) {
  const trimmed = packSize.trim();
  if (!trimmed) return unit;

  return /[a-zA-Z]/.test(trimmed)
    ? trimmed
    : unit
      ? `${trimmed} ${unit}`
      : trimmed;
}

/**
 * Maps an API product to the shape used by the registry and details views.
 * Code totals and verification status will come from their own APIs later.
 */
export function toRegistryProduct(product: Product): RegistryProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    packSize:
      combinePackSize(product.pack_size ?? "", product.unit ?? "") ||
      "Not specified",
    packSizeValue: product.pack_size,
    unit: product.unit,
    batches: product.batch_id ? 1 : 0,
    latestBatch: product.batch_no,
    codesRequested: 0,
    status: "registered",
    dateAdded: formatRegistryDate(new Date(product.created_at)),
    packagingType: product.packaging_type ?? undefined,
    description: product.description,
    brandName: product.brand_name ?? undefined,
    nafdacRegistrationNo: product.reg_no,
    barcode: product.barcode ?? undefined,
    imageUrl: product.image?.file_url ?? null,
  };
}

export function productCategoryOptions(
  products: ReadonlyArray<RegistryProduct>,
) {
  const categories = Array.from(
    new Set(products.map((product) => product.category)),
  ).sort((a, b) => a.localeCompare(b));

  return [
    { value: "all", label: "All categories" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];
}

export function getRegistryStats(products: ReadonlyArray<RegistryProduct>) {
  return {
    totalProducts: products.length,
    verifiedProducts: products.filter(
      (product) => product.status === "verified",
    ).length,
    pendingReview: products.filter(
      (product) => product.status === "pending-review",
    ).length,
    totalCodes: products.reduce(
      (total, product) => total + product.codesRequested,
      0,
    ),
    totalBatches: products.reduce(
      (total, product) => total + product.batches,
      0,
    ),
  };
}
