import { ApiError, apiFetch } from "@/lib/api/client";
import type { FileAttachment } from "@/lib/api/organizations";

export type ProductCategory =
  | "Electronics"
  | "Computers"
  | "Games"
  | "Home Goods"
  | "Toys"
  | "Clothing"
  | "Beauty"
  | "Food"
  | "Health"
  | "Household"
  | "Sports"
  | "Other";

export type ProductPackagingType = "Box" | "Pack" | "Sealed Pouch" | "Other";

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  sku: string;
  brand_name: string | null;
  category: ProductCategory;
  batch_id: string | null;
  batch_no: string | null;
  description: string;
  packaging_type: ProductPackagingType | null;
  unit: string | null;
  pack_size: string | null;
  reg_no: string;
  barcode: string | null;
  image: FileAttachment | null;
  created_at: string;
  updated_at: string;
};

export type ProductCreatePayload = {
  name: string;
  sku: string;
  brand_name?: string | null;
  category: ProductCategory;
  batch_no?: string | null;
  description: string;
  packaging_type?: ProductPackagingType | null;
  unit?: string | null;
  pack_size?: string | null;
  reg_no: string;
  barcode?: string | null;
};

type NrnNotFoundDetails = {
  code: "nrn_not_found";
  message: string;
  nrn?: string;
};

export function isNrnNotFoundError(
  error: unknown,
): error is ApiError & { details: NrnNotFoundDetails } {
  if (!(error instanceof ApiError) || error.status !== 422) {
    return false;
  }

  const details = error.details;

  return (
    typeof details === "object" &&
    details !== null &&
    !Array.isArray(details) &&
    (details as { code?: unknown }).code === "nrn_not_found"
  );
}

export const productApi = {
  list: (organizationId: string) =>
    apiFetch<Product[]>(`/organizations/${organizationId}/products`),

  get: (organizationId: string, productId: string) =>
    apiFetch<Product>(
      `/organizations/${organizationId}/products/${productId}`,
    ),

  create: (organizationId: string, payload: ProductCreatePayload) =>
    apiFetch<Product>(`/organizations/${organizationId}/products`, {
      method: "POST",
      body: payload,
    }),

  uploadImage: (organizationId: string, productId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<Product>(
      `/organizations/${organizationId}/products/${productId}/image`,
      {
        method: "POST",
        body: formData,
      },
    );
  },

  remove: (organizationId: string, productId: string) =>
    apiFetch<void>(
      `/organizations/${organizationId}/products/${productId}`,
      { method: "DELETE" },
    ),
};
