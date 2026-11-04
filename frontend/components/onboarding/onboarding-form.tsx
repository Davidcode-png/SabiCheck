"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BusinessInformation } from "@/components/onboarding/business-information";
import { ContactInformation } from "@/components/onboarding/contact-information";
import { RegulatoryInformation } from "@/components/onboarding/regulatory-information";
import { VerificationSteps } from "@/components/onboarding/verification-steps";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormNotice } from "@/components/ui/form-notice";
import type { CountryCode } from "@/components/ui/phone-field";
import { ApiError } from "@/lib/api/client";
import { organizationApi } from "@/lib/api/organizations";
import {
  INITIAL_ONBOARDING_VALUES,
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_FIELD_IDS,
  ONBOARDING_STEPS,
  isBusinessStepComplete,
  isContactStepComplete,
  isRegulatoryStepComplete,
  toOrganizationPayload,
  validateOnboarding,
  type OnboardingErrors,
  type OnboardingStepId,
  type OnboardingValues,
} from "@/lib/onboarding";

type Status = "idle" | "submitting" | "saved" | "save-error";

export function OnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState<OnboardingValues>(() => ({
    ...INITIAL_ONBOARDING_VALUES,
  }));
  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [supportingDocument, setSupportingDocument] = useState<File | null>(
    null,
  );
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("+234");
  const [activeStep, setActiveStep] = useState<OnboardingStepId>("business");
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<OnboardingValues>;
      // Restoring a locally saved draft once on mount is an intentional
      // sync with browser storage, not a render-driven state update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues((current) => {
        const next = { ...current };

        (
          Object.keys(INITIAL_ONBOARDING_VALUES) as Array<
            keyof OnboardingValues
          >
        ).forEach((key) => {
          if (typeof parsed[key] === "string") {
            next[key] = parsed[key] as string;
          }
        });

        return next;
      });
    } catch {
      // A missing or malformed draft should never block the form.
    }
  }, []);

  function update(field: keyof OnboardingValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
    setStatus((current) => (current === "submitting" ? current : "idle"));
    setSubmitError(null);
    setShowSummary(false);
  }

  function focusFirstError(nextErrors: OnboardingErrors) {
    const firstError = Object.keys(nextErrors)[0] as
      | keyof OnboardingValues
      | undefined;

    if (!firstError) return;
    document.getElementById(ONBOARDING_FIELD_IDS[firstError])?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateOnboarding(values);
    const hasErrors = Object.keys(nextErrors).length > 0;

    setErrors(nextErrors);
    setShowSummary(hasErrors);

    if (hasErrors) {
      focusFirstError(nextErrors);
      return;
    }

    setStatus("submitting");
    setSubmitError(null);

    try {
      const organization = await organizationApi.create(
        toOrganizationPayload(values, phoneCountry),
      );

      try {
        window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      } catch {
        // Draft cleanup is best-effort.
      }

      if (supportingDocument) {
        try {
          await organizationApi.uploadDocuments(
            organization.id,
            supportingDocument,
          );
        } catch (uploadError) {
          // The organization already exists; do not keep the user on a form
          // that would create a duplicate if submitted again.
          const reason =
            uploadError instanceof ApiError && uploadError.status === 503
              ? "storage"
              : "upload";

          router.replace(
            `/dashboard?onboarding=document-failed&reason=${reason}`,
          );
          return;
        }
      }

      router.replace("/dashboard?onboarding=created");
    } catch (error) {
      setStatus("idle");
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "We couldn't create your organization. Please try again.",
      );
    }
  }

  function handleSaveDraft() {
    try {
      window.localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify(values),
      );
      setStatus("saved");
    } catch {
      setStatus("save-error");
    }
  }

  function handleSelectStep(step: OnboardingStepId) {
    setActiveStep(step);

    const target = ONBOARDING_STEPS.find((item) => item.id === step);
    if (!target) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.getElementById(target.sectionId)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  const completed: Record<OnboardingStepId, boolean> = {
    business: isBusinessStepComplete(values),
    contact: isContactStepComplete(values),
    regulatory: isRegulatoryStepComplete(
      values,
      Boolean(supportingDocument),
    ),
  };

  const errorCount = Object.keys(errors).length;
  const hasNotice =
    (showSummary && errorCount > 0) ||
    Boolean(submitError) ||
    status === "saved" ||
    status === "save-error";

  return (
    <div className="mt-8 grid items-start gap-6 lg:mt-8 lg:grid-cols-[271px_minmax(0,1fr)] lg:gap-8">
      <div className="lg:sticky lg:top-6">
        <VerificationSteps
          activeStep={activeStep}
          completed={completed}
          onSelect={handleSelectStep}
        />
      </div>

      <form noValidate onSubmit={handleSubmit} className="min-w-0">
        <div className="space-y-6 lg:space-y-8">
          <BusinessInformation
            values={values}
            errors={errors}
            onChange={update}
            onFocus={() => setActiveStep("business")}
          />

          <ContactInformation
            values={values}
            errors={errors}
            country={phoneCountry}
            onCountryChange={setPhoneCountry}
            onChange={update}
            onFocus={() => setActiveStep("contact")}
          />

          <RegulatoryInformation
            values={values}
            errors={errors}
            document={supportingDocument}
            onChange={update}
            onDocumentChange={setSupportingDocument}
            onFocus={() => setActiveStep("regulatory")}
          />
        </div>

        {hasNotice ? (
          <div className="mt-6 space-y-3">
            {showSummary && errorCount > 0 ? (
              <FormAlert>
                Please complete the highlighted fields before submitting.
              </FormAlert>
            ) : null}

            {submitError ? <FormAlert>{submitError}</FormAlert> : null}

            {status === "saved" ? (
              <FormNotice>Draft saved in this browser.</FormNotice>
            ) : null}

            {status === "save-error" ? (
              <FormAlert>
                We couldn&apos;t save your draft in this browser. Please try
                again.
              </FormAlert>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            href="/dashboard"
            className="order-3 inline-flex h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-error underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/15 md:order-1"
          >
            Cancel
          </Link>

          <div className="order-1 flex flex-col gap-3 sm:flex-row md:order-2 md:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth={false}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto"
            >
              Save Draft
            </Button>

            <Button
              type="submit"
              size="md"
              fullWidth={false}
              loading={status === "submitting"}
              className="w-full sm:w-auto"
            >
              Create organization
              {status === "submitting" ? null : (
                <Send aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-1 text-center text-xs leading-5 text-muted">
          <p>
            By submitting, you agree to our verification process and data
            processing terms.
          </p>
          <p>© 2026 SabiCheck Technologies Ltd. All rights reserved.</p>
        </div>
      </form>
    </div>
  );
}
