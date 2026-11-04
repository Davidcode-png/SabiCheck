import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ProductFormSectionProps = {
  id: string;
  title: string;
  helper?: string;
  children: ReactNode;
  className?: string;
};

export function ProductFormSection({
  id,
  title,
  helper,
  children,
  className,
}: ProductFormSectionProps) {
  const headingId = `${id}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-2xl border border-dash-line bg-white p-5 sm:p-6",
        className,
      )}
    >
      <h2
        id={headingId}
        className="font-display text-lg font-bold leading-6 text-brand-ink"
      >
        {title}
      </h2>

      {helper ? (
        <p className="mt-3 text-[13px] leading-5 text-dash-muted">{helper}</p>
      ) : null}

      <div className="mt-6 space-y-5 sm:space-y-6">{children}</div>
    </section>
  );
}
