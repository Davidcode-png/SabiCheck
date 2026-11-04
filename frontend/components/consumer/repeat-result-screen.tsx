"use client";

import { Clock3, Flag, TriangleAlert } from "lucide-react";

import { ProductSummaryCard } from "@/components/consumer/product-summary-card";
import { Button } from "@/components/ui/button";
import type { CodeCheckResult } from "@/lib/api/public-code";
import { previousScanLabel } from "@/lib/consumer-check";

export function RepeatResultScreen({
  check,
  onReport,
  onBack,
}: {
  check: CodeCheckResult;
  onReport: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-[11px] font-bold uppercase leading-4 tracking-[0.12em] text-warn-ink">
        <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
        Repeat scan detected
      </span>

      <h1 className="mt-3 font-display text-[34px] font-bold leading-10 text-brand-ink">
        Check Needed
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-muted">
        A record was found, but this code has been scanned before.
      </p>

      <div className="mt-5 flex gap-3 rounded-xl bg-warn-soft p-4 text-warn-ink">
        <Clock3
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0"
          strokeWidth={1.8}
        />
        <div>
          <p className="text-sm font-bold leading-5">
            {previousScanLabel(check.previous_scans)}
          </p>
          <p className="mt-1 text-sm leading-5">
            Repeat scans can happen for different reasons. Check the pack and
            report any concerns.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ProductSummaryCard product={check.product} code={check.code} />
      </div>

      <div className="mt-6 space-y-3">
        <Button onClick={onReport}>
          <Flag aria-hidden="true" className="h-[18px] w-[18px]" />
          Report concern
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="mx-auto block rounded-lg px-3 py-2 text-sm font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          Back
        </button>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-muted">
        Repeat scans do not prove counterfeiting.
      </p>
    </div>
  );
}
