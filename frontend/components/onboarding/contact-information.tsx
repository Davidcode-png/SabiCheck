import { Contact } from "lucide-react";

import { SectionCard } from "@/components/onboarding/section-card";
import {
  PhoneField,
  type CountryCode,
} from "@/components/ui/phone-field";
import { TextField } from "@/components/ui/text-field";
import {
  ONBOARDING_FIELD_IDS,
  type OnboardingErrors,
  type OnboardingFieldChange,
  type OnboardingValues,
} from "@/lib/onboarding";

type ContactInformationProps = {
  values: OnboardingValues;
  errors: OnboardingErrors;
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onChange: OnboardingFieldChange;
  onFocus: () => void;
};

export function ContactInformation({
  values,
  errors,
  country,
  onCountryChange,
  onChange,
  onFocus,
}: ContactInformationProps) {
  return (
    <SectionCard
      id="contact-information"
      icon={Contact}
      title="Contact Information"
      onFocusCapture={onFocus}
    >
      <div className="space-y-5 md:space-y-6">
        <TextField
          id={ONBOARDING_FIELD_IDS.contactName}
          label="Contact Person Full Name"
          name="contactName"
          placeholder="Full name of person in charge"
          autoComplete="name"
          value={values.contactName}
          onChange={(event) => onChange("contactName", event.target.value)}
          error={errors.contactName}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          <TextField
            id={ONBOARDING_FIELD_IDS.email}
            label="Official Business Email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="contact@business.com"
            autoComplete="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            error={errors.email}
          />

          <PhoneField
            id={ONBOARDING_FIELD_IDS.phone}
            variant="inline"
            label="Business Phone Number"
            country={country}
            onCountryChange={onCountryChange}
            value={values.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            autoComplete="tel"
            error={errors.phone}
          />
        </div>
      </div>
    </SectionCard>
  );
}
