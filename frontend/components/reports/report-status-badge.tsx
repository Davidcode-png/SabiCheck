import {
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from "@/lib/api/reports";
import { cn } from "@/lib/cn";

const STATUS_STYLES: Record<ReportStatus, string> = {
  received: "bg-warn-soft text-warn-ink",
  under_review: "bg-[#fff8d6] text-[#8a6a00]",
  referred: "bg-dash-tint text-dash-teal",
};

export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4",
        STATUS_STYLES[status],
        className,
      )}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}
