import { apiFetch } from "@/lib/api/client";

export type DistributorType =
  | "Pharmacy"
  | "Retailer"
  | "Wholesaler"
  | "Supermarket";

export type Distributor = {
  id: string;
  name: string;
  tracking_code: string;
  distributor_type: DistributorType;
  contact_name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  total_supplies: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
};

export type DistributorList = {
  items: Distributor[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  locations: string[];
};

export type DistributorTypeFilter = "all" | DistributorType;

export type DistributorListParams = {
  search?: string;
  type?: DistributorTypeFilter;
  location?: string;
  page?: number;
  pageSize?: number;
};

export type DistributorPayload = {
  name: string;
  distributor_type: DistributorType;
  contact_name?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};

export const DISTRIBUTOR_TYPE_OPTIONS: ReadonlyArray<{
  value: DistributorType;
  label: string;
}> = [
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Retailer", label: "Retailer" },
  { value: "Wholesaler", label: "Wholesaler" },
  { value: "Supermarket", label: "Supermarket" },
];

function buildQuery(params: DistributorListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.type && params.type !== "all") {
    query.set("type", params.type);
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

export const distributorApi = {
  list: (organizationId: string, params: DistributorListParams = {}) =>
    apiFetch<DistributorList>(
      `/organizations/${organizationId}/distributors${buildQuery(params)}`,
    ),

  create: (organizationId: string, payload: DistributorPayload) =>
    apiFetch<Distributor>(
      `/organizations/${organizationId}/distributors`,
      { method: "POST", body: payload },
    ),

  update: (
    organizationId: string,
    distributorId: string,
    payload: Partial<DistributorPayload>,
  ) =>
    apiFetch<Distributor>(
      `/organizations/${organizationId}/distributors/${distributorId}`,
      { method: "PATCH", body: payload },
    ),

  remove: (organizationId: string, distributorId: string) =>
    apiFetch<void>(
      `/organizations/${organizationId}/distributors/${distributorId}`,
      { method: "DELETE" },
    ),
};
