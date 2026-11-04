import type {
  IndustryType,
  OrganizationCreatePayload,
  RegistrationType,
} from "./api/organizations";
import { EMAIL_PATTERN } from "./validation";

export type OnboardingValues = {
  companyName: string;
  registrationType: string;
  registrationNumber: string;
  manufacturerPrefix: string;
  industry: string;
  website: string;
  address: string;
  state: string;
  contactName: string;
  email: string;
  phone: string;
  nafdacDetails: string;
  referenceNumber: string;
};

export type OnboardingErrors = Partial<Record<keyof OnboardingValues, string>>;

export type OnboardingFieldChange = (
  field: keyof OnboardingValues,
  value: string,
) => void;

export const REGISTRATION_TYPE_OPTIONS = [
  { value: "llc", label: "Private Limited Company (LLC)" },
  { value: "plc", label: "Public Limited Company (PLC)" },
  { value: "business-name", label: "Business Name" },
  { value: "partnership", label: "Partnership" },
  { value: "sole-proprietorship", label: "Sole Proprietorship" },
  { value: "ngo", label: "Non-profit / NGO" },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "distribution-logistics", label: "Distribution & Logistics" },
  { value: "retail-ecommerce", label: "Retail & E-commerce" },
  { value: "healthcare-pharma", label: "Healthcare & Pharmaceuticals" },
  { value: "food-beverage", label: "Food & Beverage" },
  { value: "beauty-personal-care", label: "Beauty & Personal Care" },
  { value: "other", label: "Other" },
] as const;

/**
 * The onboarding UI uses business-facing labels while the API stores the
 * narrower registration and industry enums. Keep the mapping in one place.
 */
const REGISTRATION_TYPE_MAP: Record<string, RegistrationType> = {
  llc: "LLC",
  plc: "PLC",
  // CAC "Business Name" has no dedicated backend enum value yet.
  "business-name": "Unknown",
  partnership: "Partnership",
  "sole-proprietorship": "Sole Proprietorship",
  ngo: "NGO",
};

const INDUSTRY_TYPE_MAP: Record<string, IndustryType> = {
  manufacturing: "Other",
  "distribution-logistics": "Other",
  "retail-ecommerce": "Other",
  "healthcare-pharma": "Health",
  "food-beverage": "Food",
  "beauty-personal-care": "Beauty",
  other: "Other",
};

export const INITIAL_ONBOARDING_VALUES: OnboardingValues = {
  companyName: "",
  registrationType: "llc",
  registrationNumber: "",
  manufacturerPrefix: "",
  industry: "",
  website: "",
  address: "",
  state: "",
  contactName: "",
  email: "",
  phone: "",
  nafdacDetails: "",
  referenceNumber: "",
};

export const ONBOARDING_DRAFT_KEY = "sabicheck:onboarding-draft";

export const ONBOARDING_FIELD_IDS: Record<keyof OnboardingValues, string> = {
  companyName: "onboarding-company-name",
  registrationType: "onboarding-registration-type",
  registrationNumber: "onboarding-registration-number",
  manufacturerPrefix: "onboarding-manufacturer-prefix",
  industry: "onboarding-industry",
  website: "onboarding-website",
  address: "onboarding-address",
  state: "onboarding-state",
  contactName: "onboarding-contact-name",
  email: "onboarding-email",
  phone: "onboarding-phone",
  nafdacDetails: "onboarding-nafdac",
  referenceNumber: "onboarding-reference",
};

export const ONBOARDING_STEPS = [
  {
    id: "business",
    number: 1,
    label: "Business Details",
    shortLabel: "Business",
    sectionId: "business-information",
  },
  {
    id: "contact",
    number: 2,
    label: "Contact Info",
    shortLabel: "Contact",
    sectionId: "contact-information",
  },
  {
    id: "regulatory",
    number: 3,
    label: "Regulatory Data",
    shortLabel: "Regulatory",
    sectionId: "regulatory-information",
  },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

const URL_PATTERN = /^https?:\/\/[^\s]+\.[^\s]{2,}$/i;

export function isPhoneValid(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function validateOnboarding(
  values: OnboardingValues,
): OnboardingErrors {
  const errors: OnboardingErrors = {};

  if (!values.companyName.trim()) {
    errors.companyName = "Enter your registered company name.";
  }

  if (!values.registrationType.trim()) {
    errors.registrationType = "Select a registration type.";
  }

  if (!values.registrationNumber.trim()) {
    errors.registrationNumber = "Enter your CAC registration number.";
  }

  if (!values.manufacturerPrefix.trim()) {
    errors.manufacturerPrefix = "Enter a three-character manufacturer code prefix.";
  } else if (!/^[A-Za-z0-9]{3}$/.test(values.manufacturerPrefix.trim())) {
    errors.manufacturerPrefix = "Use exactly 3 letters or numbers.";
  }

  if (!values.industry.trim()) {
    errors.industry = "Select your industry.";
  }

  if (values.website.trim() && !URL_PATTERN.test(values.website.trim())) {
    errors.website = "Enter a full URL starting with http:// or https://.";
  }

  if (!values.address.trim()) {
    errors.address = "Enter your registered office address.";
  }

  if (!values.state.trim()) {
    errors.state = "Enter your state.";
  }

  if (!values.contactName.trim()) {
    errors.contactName = "Enter the full name of the contact person.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your business email address.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid business email address.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Enter your business phone number.";
  } else if (!isPhoneValid(values.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  return errors;
}

export function isBusinessStepComplete(values: OnboardingValues) {
  return Boolean(
    values.companyName.trim() &&
      values.registrationType.trim() &&
      values.registrationNumber.trim() &&
      /^[A-Za-z0-9]{3}$/.test(values.manufacturerPrefix.trim()) &&
      values.industry.trim() &&
      values.address.trim() &&
      values.state.trim(),
  );
}

export function isContactStepComplete(values: OnboardingValues) {
  return Boolean(
    values.contactName.trim() &&
      EMAIL_PATTERN.test(values.email.trim()) &&
      isPhoneValid(values.phone),
  );
}

export function isRegulatoryStepComplete(
  values: OnboardingValues,
  hasDocument: boolean,
) {
  return Boolean(values.nafdacDetails.trim() && hasDocument);
}

function normalizePhoneNumber(value: string, prefix: string) {
  const prefixDigits = prefix.replace(/\D/g, "");
  let national = value.replace(/\D/g, "");

  // A pasted number may already include the selected country code.
  if (national.startsWith(prefixDigits)) {
    national = national.slice(prefixDigits.length);
  }

  national = national.replace(/^0+/, "");

  return national ? `${prefix}${national}` : "";
}

export function toOrganizationPayload(
  values: OnboardingValues,
  phonePrefix: string,
): OrganizationCreatePayload {
  return {
    name: values.companyName.trim(),
    registration_type:
      REGISTRATION_TYPE_MAP[values.registrationType] ?? "Unknown",
    registration_code: values.registrationNumber.trim(),
    manufacturer_prefix: values.manufacturerPrefix.trim().toUpperCase(),
    industry_type: INDUSTRY_TYPE_MAP[values.industry] ?? "Other",
    website: values.website.trim() || null,
    state: values.state.trim(),
    country: "Nigeria",
    address: values.address.trim(),
    contact_person_full_name: values.contactName.trim(),
    business_email: values.email.trim(),
    phone_no: normalizePhoneNumber(values.phone, phonePrefix),
    registration_details: values.nafdacDetails.trim() || null,
    reference_number: values.referenceNumber.trim() || undefined,
  };
}
