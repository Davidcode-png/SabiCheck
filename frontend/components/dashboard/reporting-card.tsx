import { ArrowRight, Box, Store, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type { ReportingItem } from "@/lib/dashboard";
import { cn } from "@/lib/cn";

type ReportingCardProps = {
  id: string;
  title: string;
  subtitle: string;
  columnLabel: string;
  items: ReadonlyArray<ReportingItem>;
  icon: "product" | "distributor";
  footnote: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
};

const ICONS: Record<"product" | "distributor", LucideIcon> = {
  product: Box,
  distributor: Store,
};

export function ReportingCard({
  id,
  title,
  subtitle,
  columnLabel,
  items,
  icon,
  footnote,
  actionLabel,
  actionHref,
  className,
}: ReportingCardProps) {
  const Icon = ICONS[icon];
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-xl border border-dash-line bg-white",
        className,
      )}
    >
      <div className="px-5 pb-3 pt-5 xl:px-6">
        <h2
          id={headingId}
          className="font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl xl:leading-7"
        >
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
          {subtitle}
        </p>
      </div>

      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          {title}, {subtitle}
        </caption>
        <thead>
          <tr className="bg-dash-canvas">
            <th
              scope="col"
              className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-dash-muted xl:px-6 xl:text-[11px]"
            >
              {columnLabel}
            </th>
            <th
              scope="col"
              className="w-[90px] px-5 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-dash-muted xl:w-[100px] xl:px-6 xl:text-[11px]"
            >
              Reports
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="border-t border-dash-line">
              <td className="px-5 py-3 align-middle xl:px-6 xl:py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dash-soft text-brand-ink xl:flex"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-5 text-brand-ink">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-dash-muted">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-right align-middle xl:px-6 xl:py-3.5">
                <span className="text-[18px] font-bold leading-6 text-brand-ink">
                  {item.reports}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dash-line px-5 py-5 xl:px-6">
        <p className="text-xs leading-[18px] text-dash-muted xl:text-[13px]">
          {footnote}
        </p>
        <Link
          href={actionHref}
          className="mt-1.5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
