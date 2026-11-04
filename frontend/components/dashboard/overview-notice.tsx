import { Info } from "lucide-react";

export function OverviewNotice() {
  return (
    <div
      role="note"
      className="mt-6 flex items-start gap-2.5 rounded-lg bg-dash-tint px-4 py-4"
    >
      <Info
        aria-hidden="true"
        className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-ink"
        strokeWidth={1.7}
      />
      <p className="text-[13px] leading-5 text-brand-ink">
        A matched code means a record was found, not that the product is
        authentic. Repeat signals and reported codes need review.
      </p>
    </div>
  );
}
