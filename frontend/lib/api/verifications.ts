import { apiFetch } from "@/lib/api/client";

export type VerificationOutcome = "match" | "repeat";
export type VerificationOutcomeFilter = "all" | VerificationOutcome;
export type VerificationSort = "latest" | "oldest";

export type VerificationAttempt = {
  id: string;
  code: string;
  product_id: string;
  product_name: string | null;
  result: VerificationOutcome;
  location: string | null;
  distributor_name: string | null;
  distributor_tracking_code: string | null;
  checked_at: string;
};

export type VerificationProductOption = {
  id: string;
  name: string;
};

export type VerificationAttemptCounts = {
  all: number;
  matches: number;
  repeats: number;
};

export type VerificationAttemptList = {
  items: VerificationAttempt[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  counts: VerificationAttemptCounts;
  products: VerificationProductOption[];
  locations: string[];
};

export type VerificationAttemptListParams = {
  search?: string;
  productId?: string;
  location?: string;
  outcome?: VerificationOutcomeFilter;
  sort?: VerificationSort;
  page?: number;
  pageSize?: number;
};

function buildQuery(params: VerificationAttemptListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.productId && params.productId !== "all") {
    query.set("product_id", params.productId);
  }
  if (params.location?.trim()) {
    query.set("location", params.location.trim());
  }
  if (params.outcome && params.outcome !== "all") {
    query.set("outcome", params.outcome);
  }
  if (params.sort) {
    query.set("sort", params.sort);
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  if (params.pageSize) {
    query.set("page_size", String(params.pageSize));
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

export const verificationApi = {
  list: (
    organizationId: string,
    params: VerificationAttemptListParams = {},
  ) =>
    apiFetch<VerificationAttemptList>(
      `/organizations/${organizationId}/verifications${buildQuery(params)}`,
    ),
};

export const VERIFICATION_TABS: ReadonlyArray<{
  value: VerificationOutcomeFilter;
  label: string;
  countKey: keyof VerificationAttemptCounts;
}> = [
  { value: "all", label: "All attempts", countKey: "all" },
  { value: "match", label: "Record matches", countKey: "matches" },
  { value: "repeat", label: "Repeat-code alerts", countKey: "repeats" },
];
