import { apiDownload, apiFetch } from "@/lib/api/client";
import type { DistributorType } from "@/lib/api/distributors";

export type VerificationCodeStatus =
  | "unused"
  | "verified"
  | "used"
  | "reported";

export type VerificationCodeStatusFilter = "all" | VerificationCodeStatus;

export type CodePaymentMethod = "Card" | "Bank Transfer";

export type CodeOrderStatus = "pending" | "paid" | "failed";

export type VerificationCodeDistributor = {
  id: string;
  name: string;
  tracking_code: string;
  distributor_type: DistributorType;
  city: string | null;
  state: string | null;
};

export type VerificationCode = {
  id: string;
  code: string;
  product_id: string;
  batch_id: string | null;
  batch_no: string | null;
  order_id: string | null;
  distributor_id: string | null;
  distributor: VerificationCodeDistributor | null;
  status: VerificationCodeStatus;
  status_changed_at: string | null;
  created_at: string;
};

export type VerificationCodeUpdatePayload = {
  status?: VerificationCodeStatus;
  distributor_id?: string | null;
};

export type VerificationCodeBulkAssignPayload = {
  code_ids: string[];
  distributor_id: string | null;
};

export type VerificationCodeBulkAssignResponse = {
  updated: number;
  items: VerificationCode[];
};

export type VerificationCodeStatusCounts = {
  total: number;
  unused: number;
  verified: number;
  used: number;
  reported: number;
};

export type VerificationCodeList = {
  items: VerificationCode[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  status_counts: VerificationCodeStatusCounts;
};

export type VerificationCodeSummary = {
  total: number;
  unused: number;
  verified: number;
  used: number;
  reported: number;
  batch_no: string | null;
  manufacturer_prefix: string;
};

export type VerificationCodeOrder = {
  id: string;
  reference: string;
  product_id: string;
  batch_id: string | null;
  batch_no: string | null;
  quantity: number;
  unit_price_kobo: number;
  service_fee_kobo: number;
  total_amount_kobo: number;
  payment_method: CodePaymentMethod;
  status: CodeOrderStatus;
  paid_at: string | null;
  created_at: string;
};

export type VerificationCodeOrderCreatePayload = {
  quantity: number;
  payment_method: CodePaymentMethod;
};

export type VerificationCodeOrderCreateResponse = {
  order: VerificationCodeOrder;
  codes_generated: number;
};

export type VerificationCodeListParams = {
  status?: VerificationCodeStatusFilter;
  search?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(params: VerificationCodeListParams) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
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

export const verificationCodeApi = {
  list: (
    organizationId: string,
    productId: string,
    params: VerificationCodeListParams = {},
  ) =>
    apiFetch<VerificationCodeList>(
      `/organizations/${organizationId}/products/${productId}/verification-codes${buildQuery(
        params,
      )}`,
    ),

  summary: (organizationId: string, productId: string) =>
    apiFetch<VerificationCodeSummary>(
      `/organizations/${organizationId}/products/${productId}/verification-codes/summary`,
    ),

  orders: (organizationId: string, productId: string) =>
    apiFetch<VerificationCodeOrder[]>(
      `/organizations/${organizationId}/products/${productId}/code-orders`,
    ),

  exportCsv: (
    organizationId: string,
    productId: string,
    params: Pick<VerificationCodeListParams, "status" | "search"> = {},
  ) =>
    apiDownload(
      `/organizations/${organizationId}/products/${productId}/verification-codes/export${buildQuery(
        params,
      )}`,
    ),

  createOrder: (
    organizationId: string,
    productId: string,
    payload: VerificationCodeOrderCreatePayload,
  ) =>
    apiFetch<VerificationCodeOrderCreateResponse>(
      `/organizations/${organizationId}/products/${productId}/code-orders`,
      { method: "POST", body: payload },
    ),

  bulkAssign: (
    organizationId: string,
    productId: string,
    payload: VerificationCodeBulkAssignPayload,
  ) =>
    apiFetch<VerificationCodeBulkAssignResponse>(
      `/organizations/${organizationId}/products/${productId}/verification-codes`,
      { method: "PATCH", body: payload },
    ),

  update: (
    organizationId: string,
    productId: string,
    codeId: string,
    payload: VerificationCodeUpdatePayload,
  ) =>
    apiFetch<VerificationCode>(
      `/organizations/${organizationId}/products/${productId}/verification-codes/${codeId}`,
      { method: "PATCH", body: payload },
    ),

  updateStatus: (
    organizationId: string,
    productId: string,
    codeId: string,
    status: VerificationCodeStatus,
  ) =>
    apiFetch<VerificationCode>(
      `/organizations/${organizationId}/products/${productId}/verification-codes/${codeId}`,
      { method: "PATCH", body: { status } },
    ),
};

export const VERIFICATION_CODE_STATUS_LABELS: Record<
  VerificationCodeStatus,
  string
> = {
  unused: "Unused",
  verified: "Verified",
  used: "Used",
  reported: "Reported",
};

export const VERIFICATION_CODE_STATUS_OPTIONS: ReadonlyArray<{
  value: VerificationCodeStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "unused", label: "Unused" },
  { value: "verified", label: "Verified" },
  { value: "used", label: "Used" },
  { value: "reported", label: "Reported" },
];

export function formatKobo(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value / 100);
}
