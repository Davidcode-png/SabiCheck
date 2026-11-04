"use client";

import { CalendarDays, Lock, MapPin, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import type { ConcernValue } from "@/lib/api/public-code";
import { CONCERN_OPTIONS } from "@/lib/consumer-check";

export type ReportDetails = {
  productName: string;
  description: string;
  purchaseLocation: string;
  purchaseDate: string;
};

export const EMPTY_REPORT_DETAILS: ReportDetails = {
  productName: "",
  description: "",
  purchaseLocation: "",
  purchaseDate: "",
};

export function ReportDetailsScreen({
  code,
  concern,
  details,
  onDetailsChange,
  onConcernChange,
  onSubmit,
  loading,
  formError,
}: {
  code: string;
  concern: ConcernValue | null;
  details: ReportDetails;
  onDetailsChange: (patch: Partial<ReportDetails>) => void;
  onConcernChange: (value: ConcernValue) => void;
  onSubmit: () => void;
  loading: boolean;
  formError: string | null;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.14em] text-brand">
          Details
        </p>
        <p className="text-xs leading-5 text-muted">Step 2 of 2</p>
      </div>

      <h1 className="mt-3 font-display text-[30px] font-bold leading-[38px] text-brand-ink">
        Tell us a little more
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-muted">
        These details help us understand your concern.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <TextField
          label="Product code"
          value={code}
          readOnly
          disabled
          endAdornment={
            <Lock
              aria-hidden="true"
              className="mr-2 h-4 w-4 text-muted"
              strokeWidth={1.8}
            />
          }
          inputClassName="bg-[#f2f6f3] font-mono text-[15px] tracking-[0.06em] text-muted disabled:opacity-100"
        />

        <TextField
          label="Product full name and brand"
          name="product_name"
          value={details.productName}
          onChange={(event) =>
            onDetailsChange({ productName: event.target.value })
          }
          placeholder="e.g. Dano Cool Cow Full Cream Milk"
          maxLength={200}
        />

        <SelectField
          label="Concern"
          name="concern"
          value={concern ?? ""}
          onChange={(event) =>
            onConcernChange(event.target.value as ConcernValue)
          }
          options={CONCERN_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          placeholder="Choose a concern"
        />

        <TextareaField
          label={
            <>
              Description{" "}
              <span className="font-normal text-muted">&middot; Optional</span>
            </>
          }
          name="description"
          value={details.description}
          onChange={(event) =>
            onDetailsChange({ description: event.target.value })
          }
          placeholder="Describe what you noticed..."
          rows={4}
          maxLength={1000}
        />

        <TextField
          label="Purchase location"
          name="purchase_location"
          icon={MapPin}
          value={details.purchaseLocation}
          onChange={(event) =>
            onDetailsChange({ purchaseLocation: event.target.value })
          }
          placeholder="e.g. Mile 12 Market, Lagos"
          maxLength={255}
        />

        <TextField
          label="Purchase date"
          name="purchase_date"
          type="date"
          icon={CalendarDays}
          value={details.purchaseDate}
          onChange={(event) =>
            onDetailsChange({ purchaseDate: event.target.value })
          }
          max={today}
        />

        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <Button type="submit" loading={loading}>
          <Send aria-hidden="true" className="h-[18px] w-[18px]" />
          Submit
        </Button>
      </form>
    </div>
  );
}
