import type { VerificationOutcome } from "@/lib/api/verifications";

const OUTCOME_STYLES: Record<
  VerificationOutcome,
  { label: string; className: string; dotClassName: string }
> = {
  match: {
    label: "Record matched",
    className: "bg-[#e7f6ee] text-[#0a7a45]",
    dotClassName: "bg-[#0a7a45]",
  },
  repeat: {
    label: "Check needed",
    className: "bg-[#fff2dd] text-[#b45309]",
    dotClassName: "bg-[#d97706]",
  },
};

export function VerificationOutcomeBadge({
  outcome,
}: {
  outcome: VerificationOutcome;
}) {
  const style = OUTCOME_STYLES[outcome];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${style.className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${style.dotClassName}`}
      />
      {style.label}
    </span>
  );
}
