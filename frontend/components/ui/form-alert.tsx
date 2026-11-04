import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function FormAlert({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error",
        className,
      )}
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <span>{children}</span>
    </div>
  );
}
