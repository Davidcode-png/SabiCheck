"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Shows the result of the onboarding redirect. The organization is already
 * created even when its supporting document could not be uploaded.
 */
export function OnboardingNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const onboarding = searchParams.get("onboarding");

  if (dismissed || !onboarding) return null;

  const documentFailed = onboarding === "document-failed";
  const storageMissing = searchParams.get("reason") === "storage";

  const message = documentFailed
    ? storageMissing
      ? "Your organization was created, but document storage is not configured yet. Add your supporting document once file storage is available."
      : "Your organization was created, but the supporting document could not be uploaded. You can add it later from company settings."
    : "Your organization was created. Your workspace is ready.";

  function dismiss() {
    setDismissed(true);
    router.replace("/dashboard", { scroll: false });
  }

  const Icon = documentFailed ? AlertCircle : CheckCircle2;

  return (
    <div
      role={documentFailed ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-5",
        documentFailed
          ? "border-warn-ink/20 bg-warn-soft text-warn-ink"
          : "border-brand/15 bg-brand-soft text-brand-ink",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          documentFailed ? "text-warn-ink" : "text-brand",
        )}
      />
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
