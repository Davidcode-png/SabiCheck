"use client";

import { Flag, ScanLine, ScanSearch, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CodeCheckResult } from "@/lib/api/public-code";

function HomeButton({ onHome }: { onHome: () => void }) {
  return (
    <button
      type="button"
      onClick={onHome}
      className="mx-auto block rounded-lg px-3 py-2 text-sm font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
    >
      Home
    </button>
  );
}

export function NoMatchResultScreen({
  check,
  onRetry,
  onReport,
  onHome,
}: {
  check: CodeCheckResult;
  onRetry: () => void;
  onReport: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center pt-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#fbe9e1]">
          <SearchX
            aria-hidden="true"
            className="h-9 w-9 text-[#d97757]"
            strokeWidth={1.6}
          />
        </div>

        <h1 className="mt-5 font-display text-[30px] font-bold leading-[38px] text-[#d97757]">
          No Match Found
        </h1>
        <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-muted">
          We couldn&apos;t find an authorised record for this code. Try scanning
          the product&apos;s QR code again.
        </p>

        <div className="mt-10 w-full rounded-xl border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <ScanSearch
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-muted">
                Code scanned
              </p>
              <p className="mt-1 break-all font-mono text-lg font-bold leading-6 tracking-[0.04em] text-brand-ink">
                {check.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-10">
        <Button onClick={onRetry}>
          <ScanLine aria-hidden="true" className="h-[18px] w-[18px]" />
          Retry
        </Button>

        <Button variant="secondary" onClick={onReport}>
          <Flag aria-hidden="true" className="h-[18px] w-[18px]" />
          Report concern
        </Button>

        <HomeButton onHome={onHome} />
      </div>
    </div>
  );
}
