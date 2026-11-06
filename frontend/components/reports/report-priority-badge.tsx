import {
  REPORT_PRIORITY_LABELS,
  type ReportPriority,
} from "@/lib/api/reports";
import { cn } from "@/lib/cn";

const PRIORITY_STYLES: Record<ReportPriority, string> = {
  low: "bg-dash-soft text-dash-muted",
  normal: "bg-[#eef4fb] text-[#334e68]",
  urgent: "bg-error-soft text-error",
};

export function ReportPriorityBadge({
  priority,
  className,
}: {
  priority: ReportPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4",
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {REPORT_PRIORITY_LABELS[priority]}
    </span>
  );
}
