import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

export function CatalogueRecordNotice({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-dash-tint px-5 py-5", className)}>
      <div className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink"
          strokeWidth={1.8}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-brand-ink">
            Catalogue record only
          </p>
          <p className="mt-2 text-sm leading-6 text-brand-ink">
            Product registration does not register a production batch or
            generate verification codes.
          </p>
        </div>
      </div>
    </div>
  );
}

const NEXT_STEPS = [
  {
    title: "Product registered",
    body: "Your product appears in the Product registry with a Registered status.",
  },
  {
    title: "Add a batch separately",
    body: "Open the product, then choose Register batch. Add production date and expected release quantity.",
  },
  {
    title: "Request unit codes",
    body: "Select that registered batch when requesting codes for individual product units.",
  },
] as const;

export function WhatHappensNext({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="what-happens-next-title"
      className={cn(
        "rounded-xl border border-dash-line bg-white px-5 py-6",
        className,
      )}
    >
      <h2
        id="what-happens-next-title"
        className="font-display text-lg font-bold leading-6 text-brand-ink"
      >
        What happens next
      </h2>

      <div className="mt-4">
        {NEXT_STEPS.map((step, index) => (
          <div
            key={step.title}
            className={cn(
              index > 0 && "mt-4 border-t border-dash-line pt-4",
            )}
          >
            <h3 className="text-sm font-semibold leading-5 text-brand-ink">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-5 text-dash-muted">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
