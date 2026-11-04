"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { ProductFormSection } from "@/components/products/product-form-section";
import { ProductImageField } from "@/components/products/product-image-field";
import {
  CatalogueRecordNotice,
  WhatHappensNext,
} from "@/components/products/register-product-aside";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { ApiError } from "@/lib/api/client";
import {
  isNrnNotFoundError,
  productApi,
  type ProductCategory,
  type ProductPackagingType,
} from "@/lib/api/products";
import {
  INITIAL_REGISTER_PRODUCT_VALUES,
  PACKAGING_TYPE_OPTIONS,
  PACK_SIZE_UNIT_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
  REGISTER_PRODUCT_FIELD_IDS,
  validateRegisterProduct,
  type RegisterProductErrors,
  type RegisterProductValues,
} from "@/lib/register-product";

const PRODUCT_REGISTRY_HREF = "/dashboard/products";

const secondaryLinkClassName =
  "inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-base font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:w-auto";

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children} <span aria-hidden="true">*</span>
    </>
  );
}

type Status = "idle" | "submitting" | "registered";

export function RegisterProductForm() {
  const { selectedOrganization, selectedOrganizationId } = useOrganizations();
  const [values, setValues] = useState<RegisterProductValues>({
    ...INITIAL_REGISTER_PRODUCT_VALUES,
  });
  const [errors, setErrors] = useState<RegisterProductErrors>({});
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const organizationName = selectedOrganization?.name ?? "your organization";
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    if (registeredName) successHeadingRef.current?.focus();
  }, [registeredName]);

  function updateField(field: keyof RegisterProductValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
    setShowSummary(false);
  }

  function focusFirstError(nextErrors: RegisterProductErrors) {
    const firstError = Object.keys(nextErrors)[0] as
      | keyof RegisterProductValues
      | undefined;

    if (!firstError) return;
    document.getElementById(REGISTER_PRODUCT_FIELD_IDS[firstError])?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRegisterProduct(values);
    const hasErrors = Object.keys(nextErrors).length > 0;

    setErrors(nextErrors);
    setShowSummary(hasErrors);
    setSubmitError(null);

    if (hasErrors) {
      focusFirstError(nextErrors);
      return;
    }

    if (!selectedOrganizationId) {
      setSubmitError(
        "Select a workspace before registering a product, then try again.",
      );
      return;
    }

    setStatus("submitting");

    let createdId: string;

    try {
      const product = await productApi.create(selectedOrganizationId, {
        name: values.name.trim(),
        sku: values.sku.trim(),
        brand_name: values.brandName.trim() || null,
        category: values.category as ProductCategory,
        batch_no: values.batchNo.trim() || null,
        description: values.description.trim(),
        packaging_type:
          (values.packagingType as ProductPackagingType) || null,
        unit: values.unit || null,
        pack_size: values.packSize.trim() || null,
        reg_no: values.nafdacRegistrationNo.trim(),
        barcode: values.barcode.trim() || null,
      });
      createdId = product.id;
    } catch (cause) {
      setStatus("idle");

      if (isNrnNotFoundError(cause)) {
        const nrnError = {
          nafdacRegistrationNo: cause.message,
        };
        setErrors(nrnError);
        setShowSummary(true);
        focusFirstError(nrnError);
        return;
      }

      if (cause instanceof ApiError && cause.status === 409) {
        const conflict = {
          sku: "A product with this SKU already exists in this organization.",
        };
        setErrors(conflict);
        setShowSummary(true);
        focusFirstError(conflict);
        return;
      }

      setSubmitError(
        cause instanceof ApiError
          ? cause.message
          : "We could not register this product. Please try again.",
      );
      return;
    }

    if (image) {
      try {
        await productApi.uploadImage(selectedOrganizationId, createdId, image);
      } catch (cause) {
        setImageWarning(
          cause instanceof ApiError
            ? `The product was registered, but its image could not be uploaded. ${cause.message}`
            : "The product was registered, but its image could not be uploaded. You can add it again later.",
        );
      }
    }

    setRegisteredName(values.name.trim());
    setStatus("registered");
  }

  function registerAnother() {
    setValues({ ...INITIAL_REGISTER_PRODUCT_VALUES });
    setErrors({});
    setImage(null);
    setShowSummary(false);
    setSubmitError(null);
    setImageWarning(null);
    setRegisteredName(null);
    setStatus("idle");
  }

  return (
    <>
      <div className="mt-6 xl:hidden">
        <CatalogueRecordNotice />
      </div>

      <div className="mt-6 grid gap-6 xl:mt-8 xl:grid-cols-[minmax(0,1fr)_324px] xl:items-start">
        <div className="min-w-0">
          {registeredName ? (
            <section
              aria-labelledby="register-product-success-title"
              className="rounded-2xl border border-dash-line bg-white p-5 sm:p-8"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"
              >
                <CheckCircle2 className="h-6 w-6" strokeWidth={1.9} />
              </span>

              <h2
                id="register-product-success-title"
                ref={successHeadingRef}
                tabIndex={-1}
                className="mt-4 font-display text-[22px] font-bold leading-7 text-brand-ink outline-none"
              >
                Product registered
              </h2>

              <p className="mt-2 text-sm leading-6 text-dash-muted">
                <span className="font-semibold text-brand-ink">
                  {registeredName}
                </span>{" "}
                has been added to {organizationName}&apos;s product catalogue
                with a Registered status.
              </p>

              {imageWarning ? (
                <FormAlert className="mt-4">{imageWarning}</FormAlert>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  fullWidth={false}
                  onClick={registerAnother}
                  className="w-full sm:w-auto"
                >
                  Register another product
                </Button>
                <Link
                  href={PRODUCT_REGISTRY_HREF}
                  className={secondaryLinkClassName}
                >
                  Back to product registry
                </Link>
              </div>
            </section>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              className="space-y-6"
              aria-busy={status === "submitting" || undefined}
            >
              {showSummary && errorCount > 0 ? (
                <FormAlert>
                  Please fix the highlighted fields before registering this
                  product.
                </FormAlert>
              ) : null}

              {submitError ? <FormAlert>{submitError}</FormAlert> : null}

              <ProductFormSection
                id="product-identity"
                title="Product identity"
                helper="Default state · Fields marked * are required."
              >
                <TextField
                  id={REGISTER_PRODUCT_FIELD_IDS.name}
                  label={<RequiredLabel>Product name</RequiredLabel>}
                  name="name"
                  placeholder="Enter product name"
                  autoComplete="off"
                  required
                  value={values.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  error={errors.name}
                />

                <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                  <TextField
                    id={REGISTER_PRODUCT_FIELD_IDS.sku}
                    label={<RequiredLabel>SKU / product identifier</RequiredLabel>}
                    name="sku"
                    placeholder="Enter a unique SKU"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    value={values.sku}
                    onChange={(event) => updateField("sku", event.target.value)}
                    error={errors.sku}
                    hint={`Unique within ${organizationName}.`}
                  />

                  <TextField
                    id={REGISTER_PRODUCT_FIELD_IDS.brandName}
                    label="Brand name (optional)"
                    name="brandName"
                    placeholder="Enter product's brand name"
                    autoComplete="off"
                    value={values.brandName}
                    onChange={(event) =>
                      updateField("brandName", event.target.value)
                    }
                    error={errors.brandName}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                  <SelectField
                    id={REGISTER_PRODUCT_FIELD_IDS.category}
                    label={<RequiredLabel>Category</RequiredLabel>}
                    name="category"
                    placeholder="Select category"
                    options={PRODUCT_CATEGORY_OPTIONS}
                    required
                    value={values.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    error={errors.category}
                  />

                  <TextField
                    id={REGISTER_PRODUCT_FIELD_IDS.batchNo}
                    label="Batch No (optional)"
                    name="batchNo"
                    placeholder="Enter the product's batch no (internally used)"
                    autoComplete="off"
                    value={values.batchNo}
                    onChange={(event) =>
                      updateField("batchNo", event.target.value)
                    }
                    error={errors.batchNo}
                  />
                </div>

                <TextareaField
                  id={REGISTER_PRODUCT_FIELD_IDS.description}
                  label={<RequiredLabel>Description</RequiredLabel>}
                  name="description"
                  rows={3}
                  placeholder="Describe the product and its intended packaging."
                  value={values.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  error={errors.description}
                />

                <ProductImageField file={image} onFileChange={setImage} />
              </ProductFormSection>

              <ProductFormSection
                id="packaging"
                title="Packaging"
                helper="Default state · Fields marked * are required."
              >
                <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-6">
                  <SelectField
                    id={REGISTER_PRODUCT_FIELD_IDS.packagingType}
                    label="Packaging type (optional)"
                    name="packagingType"
                    placeholder="Select packaging type"
                    options={PACKAGING_TYPE_OPTIONS}
                    value={values.packagingType}
                    onChange={(event) =>
                      updateField("packagingType", event.target.value)
                    }
                    error={errors.packagingType}
                  />

                  <SelectField
                    id={REGISTER_PRODUCT_FIELD_IDS.unit}
                    label="Unit (optional)"
                    name="unit"
                    options={PACK_SIZE_UNIT_OPTIONS}
                    value={values.unit}
                    onChange={(event) =>
                      updateField("unit", event.target.value)
                    }
                    error={errors.unit}
                  />

                  <TextField
                    id={REGISTER_PRODUCT_FIELD_IDS.packSize}
                    label="Pack size (optional)"
                    name="packSize"
                    placeholder="e.g. 500 g"
                    autoComplete="off"
                    value={values.packSize}
                    onChange={(event) =>
                      updateField("packSize", event.target.value)
                    }
                    error={errors.packSize}
                  />
                </div>
              </ProductFormSection>

              <ProductFormSection
                id="regulatory"
                title="Regulatory"
                helper="Default state · Fields marked * are required."
              >
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                  <TextField
                    id={REGISTER_PRODUCT_FIELD_IDS.nafdacRegistrationNo}
                    label={
                      <RequiredLabel>NAFDAC Registration No</RequiredLabel>
                    }
                    name="nafdacRegistrationNo"
                    placeholder="A1-12345"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    value={values.nafdacRegistrationNo}
                    onChange={(event) =>
                      updateField("nafdacRegistrationNo", event.target.value)
                    }
                    error={errors.nafdacRegistrationNo}
                  />

                  <TextField
                    id={REGISTER_PRODUCT_FIELD_IDS.barcode}
                    label="Barcode (optional)"
                    name="barcode"
                    inputMode="numeric"
                    placeholder="61440012345"
                    autoComplete="off"
                    value={values.barcode}
                    onChange={(event) =>
                      updateField("barcode", event.target.value)
                    }
                    error={errors.barcode}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-dash-line pt-6 sm:flex-row sm:justify-end">
                  <Link
                    href={PRODUCT_REGISTRY_HREF}
                    className={secondaryLinkClassName}
                  >
                    Cancel
                  </Link>

                  <Button
                    type="submit"
                    fullWidth={false}
                    loading={status === "submitting"}
                    className="w-full sm:w-auto sm:min-w-[230px]"
                  >
                    Register product
                    {status === "submitting" ? null : (
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </ProductFormSection>
            </form>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[103px]">
          <div className="hidden xl:block">
            <CatalogueRecordNotice />
          </div>
          <WhatHappensNext />
        </aside>
      </div>
    </>
  );
}
