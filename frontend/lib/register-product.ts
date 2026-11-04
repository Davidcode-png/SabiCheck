export type RegisterProductValues = {
  name: string;
  sku: string;
  brandName: string;
  category: string;
  batchNo: string;
  description: string;
  packagingType: string;
  unit: string;
  packSize: string;
  nafdacRegistrationNo: string;
  barcode: string;
};

export type RegisterProductErrors = Partial<
  Record<keyof RegisterProductValues, string>
>;

export const REGISTER_PRODUCT_FIELD_IDS: Record<
  keyof RegisterProductValues,
  string
> = {
  name: "product-name",
  sku: "product-sku",
  brandName: "product-brand-name",
  category: "product-category",
  batchNo: "product-batch-no",
  description: "product-description",
  packagingType: "product-packaging-type",
  unit: "product-unit",
  packSize: "product-pack-size",
  nafdacRegistrationNo: "product-nafdac-registration-no",
  barcode: "product-barcode",
};

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "Electronics", label: "Electronics" },
  { value: "Computers", label: "Computers" },
  { value: "Games", label: "Games" },
  { value: "Home Goods", label: "Home Goods" },
  { value: "Toys", label: "Toys" },
  { value: "Clothing", label: "Clothing" },
  { value: "Beauty", label: "Beauty" },
  { value: "Food", label: "Food" },
  { value: "Health", label: "Health" },
  { value: "Household", label: "Household" },
  { value: "Sports", label: "Sports" },
  { value: "Other", label: "Other" },
] as const;

export const PACKAGING_TYPE_OPTIONS = [
  { value: "Box", label: "Box" },
  { value: "Pack", label: "Pack" },
  { value: "Sealed Pouch", label: "Sealed Pouch" },
  { value: "Other", label: "Other" },
] as const;

export const PACK_SIZE_UNIT_OPTIONS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "L" },
  { value: "pcs", label: "pcs" },
] as const;

export const INITIAL_REGISTER_PRODUCT_VALUES: RegisterProductValues = {
  name: "",
  sku: "",
  brandName: "",
  category: "",
  batchNo: "",
  description: "",
  packagingType: "",
  unit: "g",
  packSize: "",
  nafdacRegistrationNo: "",
  barcode: "",
};

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MIN_DIMENSION = 600;
export const PRODUCT_IMAGE_ACCEPT = "image/png,image/jpeg";
export const PRODUCT_IMAGE_HINT =
  "JPG or PNG · Up to 5 MB · At least 600 × 600 px";

export function validateRegisterProduct(
  values: RegisterProductValues,
): RegisterProductErrors {
  const errors: RegisterProductErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter the product name.";
  }

  if (!values.sku.trim()) {
    errors.sku = "Enter a unique SKU for this product.";
  }

  if (!values.category) {
    errors.category = "Select a product category.";
  }

  if (!values.description.trim()) {
    errors.description = "Enter a product description.";
  }

  if (!values.nafdacRegistrationNo.trim()) {
    errors.nafdacRegistrationNo = "Enter the NAFDAC registration number.";
  }

  const barcode = values.barcode.trim();
  if (barcode && !/^\d{8,14}$/.test(barcode)) {
    errors.barcode = "Enter a barcode of 8 to 14 digits.";
  }

  return errors;
}
