import { apiFetch } from "@/lib/api/client";

export type VerificationTrendPoint = {
  /** Calendar day in WAT, formatted as YYYY-MM-DD. */
  date: string;
  count: number;
};

export type OrganizationOverview = {
  total_products: number;
  active_batches: number;
  codes_purchased: number;
  codes_applied: number;
  matched_records: number;
  consumer_reports: number;
  verification_trend: VerificationTrendPoint[];
};

export const overviewApi = {
  get: (organizationId: string) =>
    apiFetch<OrganizationOverview>(
      `/organizations/${organizationId}/overview`,
    ),
};
