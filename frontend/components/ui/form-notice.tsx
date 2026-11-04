import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function FormNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2.5 rounded-xl bg-brand-soft px-3.5 py-3 text-sm leading-5 text-brand-ink",
        className,
      )}
    >
      <CheckCircle2
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-brand"
      />
      <span>{children}</span>
    </div>
  );
}
