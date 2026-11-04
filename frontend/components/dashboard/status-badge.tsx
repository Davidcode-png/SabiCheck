import { ALERT_STATUS_LABELS, type AlertStatus } from "@/lib/dashboard";
import { cn } from "@/lib/cn";

const STATUS_STYLES: Record<AlertStatus, string> = {
  "needs-review": "bg-warn-soft text-warn-ink",
  "in-review": "bg-dash-soft text-[#5c6e72]",
  reviewed: "bg-dash-tint text-dash-teal",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AlertStatus;
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
      {ALERT_STATUS_LABELS[status]}
    </span>
  );
}
