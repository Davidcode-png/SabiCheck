import { Info } from "lucide-react";

import { cn } from "@/lib/cn";

export function ReviewNote({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg bg-dash-canvas p-3.5", className)}>
      <Info
        aria-hidden="true"
        className="h-5 w-5 text-brand-ink"
        strokeWidth={1.6}
      />
      <p className="mt-3 text-[12.5px] font-semibold leading-[18px] text-brand-ink">
        Designed for careful review
      </p>
      <p className="mt-1.5 text-[12.5px] leading-5 text-dash-muted">
        Code activity and reports need context before action.
      </p>
    </div>
  );
}
