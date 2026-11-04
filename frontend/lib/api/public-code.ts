import { apiFetch } from "@/lib/api/client";
import type { DistributorType } from "@/lib/api/distributors";

export type CodeCheckOutcome = "match" | "no_match" | "repeat";

export type PublicDistributor = {
  name: string;
  distributor_type: DistributorType;
  tracking_code: string;
  city: string | null;
  state: string | null;
};

export type PublicProduct = {
  id: string;
  name: string;
  brand_name: string | null;
  sku: string;
  pack_size: string | null;
  unit: string | null;
  packaging_type: string | null;
  reg_no: string;
  batch_no: string | null;
  manufacturer_name: string;
  image_url: string | null;
  distributor: PublicDistributor | null;
};

export type CodeCheckResult = {
  result: CodeCheckOutcome;
  code: string;
  check_count: number;
  previous_scans: number;
  product: PublicProduct | null;
};

export const CONCERN_VALUES = [
  "Suspected counterfeit",
  "Unmatched code",
  "Damaged packaging",
  "Code has already been used",
  "Unusual appearance or smell",
  "Illness",
  "Expired",
  "Other concern",
] as const;

export type ConcernValue = (typeof CONCERN_VALUES)[number];

export type CodeReportCreatePayload = {
  code: string;
  concern: ConcernValue;
  product_name?: string | null;
  description?: string | null;
  purchase_location?: string | null;
  purchase_date?: string | null;
};

export type CodeReportResult = {
  reference: string;
  code: string;
  concern: ConcernValue;
  product_name: string | null;
  created_at: string;
};

export const publicCodeApi = {
  check: (code: string) =>
    apiFetch<CodeCheckResult>("/public/code-checks", {
      method: "POST",
      body: { code },
      auth: false,
    }),

  report: (payload: CodeReportCreatePayload) =>
    apiFetch<CodeReportResult>("/public/code-reports", {
      method: "POST",
      body: payload,
      auth: false,
    }),
};
