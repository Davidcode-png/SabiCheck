"use client";

import { Building2, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { FormAlert } from "@/components/ui/form-alert";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { ApiError } from "@/lib/api/client";
import {
  DISTRIBUTOR_TYPE_OPTIONS,
  distributorApi,
  type Distributor,
  type DistributorPayload,
  type DistributorType,
} from "@/lib/api/distributors";

type FormValues = {
  name: string;
  distributorType: DistributorType;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function initialValues(distributor: Distributor | null): FormValues {
  return {
    name: distributor?.name ?? "",
    distributorType: distributor?.distributor_type ?? "Pharmacy",
    contactName: distributor?.contact_name ?? "",
    phone: distributor?.phone ?? "",
    email: distributor?.email ?? "",
    city: distributor?.city ?? "",
    state: distributor?.state ?? "",
    address: distributor?.address ?? "",
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter the distributor's name.";
  }

  if (!values.contactName.trim()) {
    errors.contactName = "Enter a contact person.";
  }

  const digits = values.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    errors.phone = "Enter a valid phone number.";
  }

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.city.trim()) {
    errors.city = "Enter the city where this distributor operates.";
  }

  return errors;
}

export function DistributorDialog({
  organizationId,
  distributor,
  onClose,
  onSaved,
}: {
  organizationId: string;
  distributor?: Distributor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<FormValues>(() =>
    initialValues(distributor ?? null),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editing = Boolean(distributor);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (submitting) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: DistributorPayload = {
      name: values.name.trim(),
      distributor_type: values.distributorType,
      contact_name: values.contactName.trim() || null,
      phone: values.phone.trim(),
      email: values.email.trim() || null,
      city: values.city.trim() || null,
      state: values.state.trim() || null,
      address: values.address.trim() || null,
    };

    try {
      if (distributor) {
        await distributorApi.update(organizationId, distributor.id, payload);
      } else {
        await distributorApi.create(organizationId, payload);
      }

      onSaved();
      onClose();
    } catch (cause) {
      setFormError(
        cause instanceof ApiError
          ? cause.message
          : "We could not save this distributor. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="distributor-dialog-title"
      onClose={onClose}
      onClick={handleDialogClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[min(600px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase leading-4 tracking-[0.12em] text-dash-muted">
              Distribution
            </p>
            <h2
              id="distributor-dialog-title"
              className="mt-1 font-display text-xl font-bold leading-7 text-brand-ink sm:text-2xl sm:leading-8"
            >
              {editing ? "Edit distributor" : "Add distributor"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-dash-muted">
          {editing
            ? "Update the details for this distributor."
            : "Add a pharmacy or retailer that moves your products to consumers."}
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Distributor name"
            name="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. HealthPlus Pharmacy"
            autoComplete="organization"
            maxLength={255}
            error={errors.name}
            autoFocus
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField
              label="Distributor type"
              name="distributor_type"
              value={values.distributorType}
              onChange={(event) =>
                update(
                  "distributorType",
                  event.target.value as DistributorType,
                )
              }
              options={DISTRIBUTOR_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />

            <TextField
              label="Contact person"
              name="contact_name"
              value={values.contactName}
              onChange={(event) => update("contactName", event.target.value)}
              placeholder="e.g. Adebola Williams"
              autoComplete="name"
              maxLength={255}
              error={errors.contactName}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label="Phone number"
              name="phone"
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+234 802 345 6789"
              autoComplete="tel"
              maxLength={32}
              error={errors.phone}
            />

            <TextField
              label={
                <>
                  Email{" "}
                  <span className="font-normal text-muted">
                    &middot; Optional
                  </span>
                </>
              }
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="name@business.com"
              autoComplete="email"
              maxLength={255}
              error={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label="City / Location"
              name="city"
              value={values.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="e.g. Lagos"
              autoComplete="address-level2"
              maxLength={120}
              error={errors.city}
            />

            <TextField
              label={
                <>
                  State{" "}
                  <span className="font-normal text-muted">
                    &middot; Optional
                  </span>
                </>
              }
              name="state"
              value={values.state}
              onChange={(event) => update("state", event.target.value)}
              placeholder="e.g. Lagos"
              autoComplete="address-level1"
              maxLength={120}
            />
          </div>

          <TextareaField
            label={
              <>
                Address{" "}
                <span className="font-normal text-muted">
                  &middot; Optional
                </span>
              </>
            }
            name="address"
            value={values.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Street, area or landmark"
            rows={3}
            maxLength={512}
          />

          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                />
              ) : (
                <Building2 aria-hidden="true" className="h-4 w-4" />
              )}
              {submitting
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Add distributor"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
