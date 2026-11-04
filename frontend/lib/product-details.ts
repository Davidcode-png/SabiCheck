import type { RegistryProduct } from "@/lib/product-registry";

export type ProductCodeTotals = {
  purchased: number;
  printed: number;
  unused: number;
  purchaseDescription: string;
  printedDescription: string;
  unusedDescription: string;
  batchReference: string | null;
  asOf: string;
};

export type ProductOrderBatch = {
  id: string;
  label: string;
  codeOrderId: string;
  productionDate: string;
  codeRequests: number;
  expectedRelease: number;
};

export type ProductDistributionMovement = {
  id: string;
  reference: string;
  date: string;
  location: string;
  distributor: string;
  unitsMoved: number;
};

export type ProductDetails = {
  codeTotals: ProductCodeTotals;
  orderBatches: ProductOrderBatch[];
  distribution: ProductDistributionMovement[];
};

export function formatDetailsAsOf(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  })
    .format(date)
    .replace(",", "");
}

/**
 * Code totals, order batches and distribution records are owned by their own
 * domains. Until those APIs exist, a product only has its catalogue details.
 */
export function getProductDetails(product: RegistryProduct): ProductDetails {
  const hasCodes = product.codesRequested > 0;

  return {
    codeTotals: {
      purchased: product.codesRequested,
      printed: 0,
      unused: product.codesRequested,
      purchaseDescription: hasCodes
        ? "Cumulative across all code orders"
        : "No codes purchased yet",
      printedDescription: "No print runs recorded",
      unusedDescription: hasCodes ? "Ready to print" : "No codes available",
      batchReference: product.latestBatch,
      asOf: formatDetailsAsOf(new Date()),
    },
    orderBatches: [],
    distribution: [],
  };
}
