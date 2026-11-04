import type { LucideIcon } from "lucide-react";
import type { FocusEventHandler, ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionCardProps = {
  id: string;
  icon: LucideIcon;
  title: string;
  required?: boolean;
  children: ReactNode;
  onFocusCapture?: FocusEventHandler<HTMLElement>;
  className?: string;
};

export function SectionCard({
  id,
  icon: Icon,
  title,
  required = false,
  children,
  onFocusCapture,
  className,
}: SectionCardProps) {
  const headingId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      onFocusCapture={onFocusCapture}
      className={cn(
        "scroll-mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-canvas/60 px-5 py-4 md:px-8">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-brand shadow-[0_1px_2px_rgb(16_24_40_/_0.04)]"
        >
          <Icon className="h-4 w-4" />
        </span>

        <h2
          id={headingId}
          className="font-display text-base font-bold leading-6 text-brand-ink"
        >
          {title}
        </h2>

        {required ? (
          <span className="ml-auto rounded border border-line bg-white px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-muted">
            Required
          </span>
        ) : null}
      </div>

      <div className="p-5 md:p-8">{children}</div>
    </section>
  );
}
