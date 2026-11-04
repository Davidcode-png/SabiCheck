import { Headset, LockKeyhole, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

// TODO: point these at the real policy and help pages.
const LEGAL_LINKS = [
  { label: "Privacy Policy", shortLabel: "Privacy", href: "#" },
  { label: "Terms of Service", shortLabel: "Terms", href: "#" },
  { label: "Help Center", shortLabel: "Support", href: "#" },
];

function LegalFooter({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <nav
        aria-label="Legal"
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 md:gap-x-6"
      >
        {LEGAL_LINKS.map((link, index) => (
          <span key={link.label} className="flex items-center gap-3 md:gap-6">
            {compact && index > 0 ? (
              <span aria-hidden="true" className="text-[11px] text-line-strong md:hidden">
                ·
              </span>
            ) : null}
            <Link
              href={link.href}
              className={cn(
                "rounded-sm text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                compact
                  ? "text-[11px] font-semibold uppercase md:text-sm md:font-normal md:normal-case"
                  : "text-sm font-medium",
              )}
            >
              {compact ? (
                <>
                  <span className="md:hidden">{link.shortLabel}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </>
              ) : (
                link.label
              )}
            </Link>
          </span>
        ))}
      </nav>

      <p
        className={cn(
          "mt-4 text-center text-muted",
          compact
            ? "text-[10px] font-medium uppercase leading-5 md:text-xs md:font-normal md:normal-case"
            : "text-xs leading-5",
        )}
      >
        {compact ? (
          <>
            <span className="md:hidden">© 2026 SabiCheck Technologies Ltd.</span>
            <span className="hidden md:inline">
              © 2026 SabiCheck Technologies Ltd. All rights reserved.
            </span>
          </>
        ) : (
          "© 2026 SabiCheck Technologies Ltd. All rights reserved."
        )}
      </p>
    </div>
  );
}

const META_ITEMS = [
  {
    label: "Last login",
    value: "12.05.24",
    order: "order-3 md:order-1",
  },
  {
    label: "System status",
    value: "Active",
    dot: true,
    order: "order-1 md:order-2",
  },
  {
    label: "Region",
    value: "Lagos (N)",
    order: "order-2 md:order-3",
  },
];

export function SignInFooter() {
  return (
    <footer className="w-full max-w-[480px]">
      <div className="mx-auto w-full max-w-[400px] border-y border-line py-5 md:border-y-0 md:py-0">
        <dl className="grid grid-cols-3 gap-4">
          {META_ITEMS.map((item) => (
            <div key={item.label} className={item.order}>
              <dt className="text-[11px] font-semibold uppercase leading-4 text-muted">
                {item.label}
              </dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-brand-ink md:text-sm">
                {item.dot ? (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                  />
                ) : null}
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <LegalFooter compact className="mt-7 md:mt-12" />
    </footer>
  );
}

type TrustItem = {
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  value: string;
};

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: Zap,
    label: "Fast setup",
    shortLabel: "Fast setup",
    value: "Ready in < 2m",
  },
  {
    icon: LockKeyhole,
    label: "Secure",
    shortLabel: "ISO secure",
    value: "ISO 27001",
  },
  {
    icon: Headset,
    label: "Support",
    shortLabel: "24/7 live",
    value: "24/7 Priority",
  },
];

export function SignUpFooter() {
  return (
    <footer className="w-full max-w-[536px]">
      <ul className="mx-auto grid w-full max-w-[440px] grid-cols-3 gap-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <li
              key={item.label}
              className="flex flex-col items-center text-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <span className="mt-3 text-[11px] font-semibold uppercase leading-4 text-muted">
                <span className="md:hidden">{item.shortLabel}</span>
                <span className="hidden md:inline">{item.label}</span>
              </span>
              <span className="mt-1 hidden text-sm font-semibold text-brand-ink md:block">
                {item.value}
              </span>
            </li>
          );
        })}
      </ul>

      <LegalFooter className="mt-10 md:mt-14" />
    </footer>
  );
}
