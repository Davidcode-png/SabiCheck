"use client";

import { CircleCheck, Info, ScanLine } from "lucide-react";

import { ProductSummaryCard } from "@/components/consumer/product-summary-card";
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

export function MatchResultScreen({
  check,
  onScanAnother,
  onReport,
  onHome,
}: {
  check: CodeCheckResult;
  onScanAnother: () => void;
  onReport: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase leading-4 tracking-[0.12em] text-brand-ink">
        <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
        Record located
      </span>

      <h1 className="mt-3 font-display text-[34px] font-bold leading-10 text-brand-ink">
        Match Found
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-muted">
        This code matches a listed product record. Compare the details with your
        pack.
      </p>

      <div className="mt-5">
        <ProductSummaryCard product={check.product} code={check.code} />
      </div>

      <div className="mt-5 flex gap-3 rounded-xl bg-brand-soft/70 p-4 text-brand-ink">
        <Info
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0"
          strokeWidth={1.8}
        />
        <p className="text-sm leading-5">
          Code matches a listed record. This does not guarantee the pack is
          genuine.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Button onClick={onScanAnother}>
          <ScanLine aria-hidden="true" className="h-[18px] w-[18px]" />
          Scan another product
        </Button>

        <button
          type="button"
          onClick={onReport}
          className="mx-auto block rounded-lg px-3 py-2 text-sm font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          Report a concern
        </button>

        <HomeButton onHome={onHome} />
      </div>
    </div>
  );
}
