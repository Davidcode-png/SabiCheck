import { Building2 } from "lucide-react";

import { SectionCard } from "@/components/onboarding/section-card";
import { SelectField } from "@/components/ui/select-field";
import { TextField, controlClassName, fieldLabelClassName } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import {
  INDUSTRY_OPTIONS,
  ONBOARDING_FIELD_IDS,
  REGISTRATION_TYPE_OPTIONS,
  type OnboardingErrors,
  type OnboardingFieldChange,
  type OnboardingValues,
} from "@/lib/onboarding";
import { cn } from "@/lib/cn";

type BusinessInformationProps = {
  values: OnboardingValues;
  errors: OnboardingErrors;
  onChange: OnboardingFieldChange;
  onFocus: () => void;
};

export function BusinessInformation({
  values,
  errors,
  onChange,
  onFocus,
}: BusinessInformationProps) {
  return (
    <SectionCard
      id="business-information"
      icon={Building2}
      title="Business Information"
      required
      onFocusCapture={onFocus}
    >
      <div className="space-y-5 md:space-y-6">
        <TextField
          id={ONBOARDING_FIELD_IDS.companyName}
          label="Registered Company Name"
          name="companyName"
          placeholder="e.g. Acme Global Logistics Ltd"
          autoComplete="organization"
          value={values.companyName}
          onChange={(event) => onChange("companyName", event.target.value)}
          error={errors.companyName}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          <SelectField
            id={ONBOARDING_FIELD_IDS.registrationType}
            label="Business Registration Type"
            name="registrationType"
            options={REGISTRATION_TYPE_OPTIONS}
            value={values.registrationType}
            onChange={(event) =>
              onChange("registrationType", event.target.value)
            }
            error={errors.registrationType}
          />

          <TextField
            id={ONBOARDING_FIELD_IDS.registrationNumber}
            label="Registration Number (CAC)"
            name="registrationNumber"
            placeholder="RC1234567"
            autoComplete="off"
            spellCheck={false}
            value={values.registrationNumber}
            onChange={(event) =>
              onChange("registrationNumber", event.target.value)
            }
            error={errors.registrationNumber}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          <SelectField
            id={ONBOARDING_FIELD_IDS.industry}
            label="Industry"
            name="industry"
            placeholder="Select Industry"
            options={INDUSTRY_OPTIONS}
            value={values.industry}
            onChange={(event) => onChange("industry", event.target.value)}
            error={errors.industry}
          />

          <TextField
            id={ONBOARDING_FIELD_IDS.manufacturerPrefix}
            label="Manufacturer Code Prefix"
            name="manufacturerPrefix"
            placeholder="MAT"
            autoComplete="off"
            spellCheck={false}
            maxLength={3}
            value={values.manufacturerPrefix}
            onChange={(event) =>
              onChange("manufacturerPrefix", event.target.value.toUpperCase())
            }
            error={errors.manufacturerPrefix}
            hint="Three letters or numbers used at the start of every verification code."
          />
        </div>

        <TextField
          id={ONBOARDING_FIELD_IDS.website}
          label="Company Website"
          name="website"
          type="url"
          inputMode="url"
          placeholder="https://www.company.com"
          autoComplete="url"
          value={values.website}
          onChange={(event) => onChange("website", event.target.value)}
          error={errors.website}
        />

        <TextareaField
          id={ONBOARDING_FIELD_IDS.address}
          label="Registered Office Address"
          name="address"
          rows={2}
          placeholder="123 Business Avenue, Victoria Island"
          autoComplete="street-address"
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          error={errors.address}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          <TextField
            id={ONBOARDING_FIELD_IDS.state}
            label="State"
            name="state"
            placeholder="Lagos"
            autoComplete="address-level1"
            value={values.state}
            onChange={(event) => onChange("state", event.target.value)}
            error={errors.state}
          />

          <div className="w-full">
            <div className="mb-2 flex min-h-5 items-center">
              <label
                htmlFor="onboarding-country"
                className={fieldLabelClassName}
              >
                Country
              </label>
            </div>

            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 flex h-3.5 w-5 -translate-y-1/2 overflow-hidden rounded-[2px] ring-1 ring-inset ring-black/5"
              >
                <span className="h-full w-1/3 bg-[#008751]" />
                <span className="h-full w-1/3 bg-white" />
                <span className="h-full w-1/3 bg-[#008751]" />
              </span>

              <input
                id="onboarding-country"
                name="country"
                value="Nigeria"
                readOnly
                aria-readonly="true"
                className={cn(
                  controlClassName,
                  "cursor-default bg-[#f9fafb] pl-11 text-label hover:border-line",
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
