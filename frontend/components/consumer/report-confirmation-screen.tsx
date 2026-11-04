"use client";

import { Check, CheckCheck, Copy, Home } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CodeReportResult } from "@/lib/api/public-code";

export function ReportConfirmationScreen({
  report,
  onHome,
}: {
  report: CodeReportResult;
  onHome: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(report.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the reference stays visible on screen.
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center pt-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-brand-soft">
          <CheckCheck
            aria-hidden="true"
            className="h-9 w-9 text-brand"
            strokeWidth={1.8}
          />
        </div>

        <h1 className="mt-5 font-display text-[30px] font-bold leading-[38px] text-brand-ink">
          Report received
        </h1>
        <p className="mt-2 max-w-[330px] text-[15px] leading-6 text-muted">
          Thank you for speaking up. Your concern helps build a clearer picture
          of products in circulation.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-line bg-white p-5 text-left shadow-card">
          <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-muted">
            Your report reference
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="break-all font-display text-[28px] font-bold leading-9 tracking-[0.04em] text-brand-ink">
              {report.reference}
            </p>
            <button
              type="button"
              onClick={copyReference}
              aria-label={copied ? "Reference copied" : "Copy reference"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              {copied ? (
                <Check aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <Copy aria-hidden="true" className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
          <span aria-live="polite" className="sr-only">
            {copied ? "Reference copied" : ""}
          </span>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm leading-5 text-muted">Concern</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-brand-ink">
              {report.concern}
            </p>

            <p className="mt-3 text-sm leading-5 text-muted">Product code</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold leading-5 text-brand-ink">
              {report.code}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-5 text-muted">
          Keep this reference for your records.
        </p>
      </div>

      <div className="mt-auto space-y-3 pt-10">
        <Button onClick={onHome}>
          <Home aria-hidden="true" className="h-[18px] w-[18px]" />
          Home
        </Button>

        <p className="text-center text-xs leading-5 text-muted">
          SabiCheck &middot; Consumer report
        </p>
      </div>
    </div>
  );
}
