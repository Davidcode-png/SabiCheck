import { apiDownload, apiFetch } from "@/lib/api/client";
import {
  CONCERN_VALUES,
  type ConcernValue,
} from "@/lib/api/public-code";

export type ReportStatus = "received" | "under_review" | "referred";

export type ReportReviewer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type ReportDistributor = {
  id: string;
  name: string;
  tracking_code: string;
  city: string | null;
  state: string | null;
};

export type ConsumerReport = {
  id: string;
  reference: string;
  code: string;
  product_id: string | null;
  product_name: string | null;
  concern: ConcernValue;
  description: string | null;
  purchase_location: string | null;
  purchase_date: string | null;
  status: ReportStatus;
  reviewer: ReportReviewer | null;
  distributor: ReportDistributor | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsumerReportList = {
  items: ConsumerReport[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  locations: string[];
};

export type ReportStatusFilter = "all" | ReportStatus;
export type ReportIssueFilter = "all" | ConcernValue;

export type ConsumerReportListParams = {
  search?: string;
  issueType?: ReportIssueFilter;
  status?: ReportStatusFilter;
  location?: string;
  page?: number;
  pageSize?: number;
};

export type ConsumerReportUpdatePayload = {
  status?: ReportStatus;
  reviewer_id?: string | null;
  distributor_id?: string | null;
};

export const REPORT_STATUS_OPTIONS: ReadonlyArray<{
  value: ReportStatus;
  label: string;
}> = [
  { value: "received", label: "Received" },
  { value: "under_review", label: "Under review" },
  { value: "referred", label: "Referred" },
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  received: "Received",
  under_review: "Under review",
  referred: "Referred",
};

export const REPORT_ISSUE_OPTIONS: ReadonlyArray<{
  value: ConcernValue;
  label: string;
}> = CONCERN_VALUES.map((value) => ({ value, label: value }));

function buildQuery(params: ConsumerReportListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.issueType && params.issueType !== "all") {
    query.set("issue_type", params.issueType);
  }
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.location?.trim()) {
    query.set("location", params.location.trim());
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

export const reportApi = {
  list: (organizationId: string, params: ConsumerReportListParams = {}) =>
    apiFetch<ConsumerReportList>(
      `/organizations/${organizationId}/reports${buildQuery(params)}`,
    ),

  get: (organizationId: string, reportId: string) =>
    apiFetch<ConsumerReport>(
      `/organizations/${organizationId}/reports/${reportId}`,
    ),

  update: (
    organizationId: string,
    reportId: string,
    payload: ConsumerReportUpdatePayload,
  ) =>
    apiFetch<ConsumerReport>(
      `/organizations/${organizationId}/reports/${reportId}`,
      { method: "PATCH", body: payload },
    ),

  export: (
    organizationId: string,
    params: Omit<ConsumerReportListParams, "page" | "pageSize"> = {},
  ) =>
    apiDownload(
      `/organizations/${organizationId}/reports/export${buildQuery(params)}`,
    ),
};
