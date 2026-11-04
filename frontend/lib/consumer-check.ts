import {
  CONCERN_VALUES,
  type CodeCheckOutcome,
  type ConcernValue,
  type PublicProduct,
} from "@/lib/api/public-code";

export const CONCERN_OPTIONS: ReadonlyArray<{
  value: ConcernValue;
  label: string;
}> = CONCERN_VALUES.map((value) => ({ value, label: value }));

/** Pick the most likely concern for the result the consumer just saw. */
export function defaultConcernFor(outcome: CodeCheckOutcome): ConcernValue {
  if (outcome === "no_match") return "Unmatched code";
  if (outcome === "repeat") return "Code has already been used";
  return "Suspected counterfeit";
}

/** Build the product label used on the report details form. */
export function productNameFor(product: PublicProduct | null) {
  if (!product) return "";

  return [product.brand_name, product.name]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .trim();
}

/** Human wording for the repeat-scan banner. */
export function previousScanLabel(count: number) {
  if (count <= 0) return "This code has been checked before";

  return `This code has ${count} previous scan${count === 1 ? "" : "s"}`;
}
