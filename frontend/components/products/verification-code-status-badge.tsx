import {
  VERIFICATION_CODE_STATUS_LABELS,
  type VerificationCodeStatus,
} from "@/lib/api/verification-codes";
import { cn } from "@/lib/cn";

const STATUS_STYLES: Record<VerificationCodeStatus, string> = {
  unused: "border-[#d7e3f4] bg-[#f3f7fd] text-[#23527c]",
  verified: "border-[#c8e6d2] bg-[#effaf2] text-[#146b3a]",
  used: "border-[#e5dcc8] bg-[#fbf7ee] text-[#7a5a16]",
  reported: "border-error/20 bg-error-soft text-error",
};

export function VerificationCodeStatusBadge({
  status,
  className,
}: {
  status: VerificationCodeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-4",
        STATUS_STYLES[status],
        className,
      )}
    >
      {VERIFICATION_CODE_STATUS_LABELS[status]}
    </span>
  );
}
