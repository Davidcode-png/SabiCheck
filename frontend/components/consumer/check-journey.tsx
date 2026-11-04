"use client";

import { useEffect, useState } from "react";

import { CodeEntryScreen } from "@/components/consumer/code-entry-screen";
import { ConsumerShell } from "@/components/consumer/consumer-shell";
import { MatchResultScreen } from "@/components/consumer/match-result-screen";
import { NoMatchResultScreen } from "@/components/consumer/no-match-result-screen";
import { RepeatResultScreen } from "@/components/consumer/repeat-result-screen";
import {
  EMPTY_REPORT_DETAILS,
  ReportDetailsScreen,
  type ReportDetails,
} from "@/components/consumer/report-details-screen";
import { ReportConcernScreen } from "@/components/consumer/report-concern-screen";
import { ReportConfirmationScreen } from "@/components/consumer/report-confirmation-screen";
import { ApiError } from "@/lib/api/client";
import {
  publicCodeApi,
  type CodeCheckResult,
  type CodeReportResult,
  type ConcernValue,
} from "@/lib/api/public-code";
import {
  defaultConcernFor,
  productNameFor,
} from "@/lib/consumer-check";

type Step =
  | "entry"
  | "result"
  | "report-concern"
  | "report-details"
  | "report-confirmation";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function CheckJourney() {
  const [step, setStep] = useState<Step>("entry");
  const [code, setCode] = useState("");
  const [check, setCheck] = useState<CodeCheckResult | null>(null);
  const [concern, setConcern] = useState<ConcernValue | null>(null);
  const [details, setDetails] = useState<ReportDetails>(EMPTY_REPORT_DETAILS);
  const [report, setReport] = useState<CodeReportResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [checkFieldError, setCheckFieldError] = useState<string | null>(null);
  const [checkFormError, setCheckFormError] = useState<string | null>(null);
  const [reportFormError, setReportFormError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function resetJourney() {
    setStep("entry");
    setCode("");
    setCheck(null);
    setConcern(null);
    setDetails(EMPTY_REPORT_DETAILS);
    setReport(null);
    setIsChecking(false);
    setIsReporting(false);
    setCheckFieldError(null);
    setCheckFormError(null);
    setReportFormError(null);
  }

  function handleCodeChange(value: string) {
    setCode(value);
    setCheckFieldError(null);
    setCheckFormError(null);
  }

  async function handleCheck() {
    const trimmed = code.trim();

    if (!trimmed) {
      setCheckFieldError("Enter the code from your product pack.");
      return;
    }

    setIsChecking(true);
    setCheckFieldError(null);
    setCheckFormError(null);

    try {
      const result = await publicCodeApi.check(trimmed);

      setCheck(result);
      setCode(result.code || trimmed);
      setConcern(defaultConcernFor(result.result));
      setDetails((current) => ({
        ...current,
        productName: productNameFor(result.product),
      }));
      setStep("result");
    } catch (error) {
      setCheckFormError(
        errorMessage(
          error,
          "We could not check that code. Please try again.",
        ),
      );
    } finally {
      setIsChecking(false);
    }
  }

  function handleStartReport() {
    if (!check) return;

    setReport(null);
    setReportFormError(null);
    setConcern((current) => current ?? defaultConcernFor(check.result));
    setStep("report-concern");
  }

  function handleConcernChange(value: ConcernValue) {
    setConcern(value);
  }

  function handleDetailsChange(patch: Partial<ReportDetails>) {
    setDetails((current) => ({ ...current, ...patch }));
  }

  async function handleSubmitReport() {
    if (!check || !concern) return;

    setIsReporting(true);
    setReportFormError(null);

    try {
      const result = await publicCodeApi.report({
        code: check.code,
        concern,
        product_name: details.productName.trim() || null,
        description: details.description.trim() || null,
        purchase_location: details.purchaseLocation.trim() || null,
        purchase_date: details.purchaseDate || null,
      });

      setReport(result);
      setStep("report-confirmation");
    } catch (error) {
      setReportFormError(
        errorMessage(
          error,
          "We could not submit your report. Please try again.",
        ),
      );
    } finally {
      setIsReporting(false);
    }
  }

  function handleBack() {
    if (step === "report-concern") {
      setStep("result");
      return;
    }

    if (step === "report-details") {
      setStep("report-concern");
      return;
    }

    resetJourney();
  }

  const headerTitle =
    step === "entry"
      ? "Enter code"
      : step === "result"
        ? "Check result"
        : "Report a concern";

  return (
    <ConsumerShell title={headerTitle} onBack={handleBack}>
      {step === "entry" ? (
        <CodeEntryScreen
          code={code}
          onCodeChange={handleCodeChange}
          onSubmit={handleCheck}
          loading={isChecking}
          fieldError={checkFieldError}
          formError={checkFormError}
        />
      ) : null}

      {step === "result" && check ? (
        check.result === "match" ? (
          <MatchResultScreen
            check={check}
            onScanAnother={resetJourney}
            onReport={handleStartReport}
            onHome={resetJourney}
          />
        ) : check.result === "repeat" ? (
          <RepeatResultScreen
            check={check}
            onReport={handleStartReport}
            onBack={resetJourney}
          />
        ) : (
          <NoMatchResultScreen
            check={check}
            onRetry={resetJourney}
            onReport={handleStartReport}
            onHome={resetJourney}
          />
        )
      ) : null}

      {step === "report-concern" ? (
        <ReportConcernScreen
          concern={concern}
          onConcernChange={handleConcernChange}
          onContinue={() => setStep("report-details")}
        />
      ) : null}

      {step === "report-details" && check ? (
        <ReportDetailsScreen
          code={check.code}
          concern={concern}
          details={details}
          onDetailsChange={handleDetailsChange}
          onConcernChange={handleConcernChange}
          onSubmit={handleSubmitReport}
          loading={isReporting}
          formError={reportFormError}
        />
      ) : null}

      {step === "report-confirmation" && report ? (
        <ReportConfirmationScreen report={report} onHome={resetJourney} />
      ) : null}
    </ConsumerShell>
  );
}
