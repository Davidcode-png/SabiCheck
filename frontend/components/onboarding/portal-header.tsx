import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

export type PortalUser = {
  name: string;
  email: string;
  initials: string;
};

export function OnboardingStatus({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1.5 text-xs font-semibold text-brand-ink",
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
      Onboarding in progress
    </span>
  );
}

export function PortalHeader({ user }: { user: PortalUser }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8 md:h-[77px]">
        <Logo
          href={null}
          priority
          tagline="Business Portal"
          markClassName="h-9 w-9 md:h-10 md:w-10"
        />

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:block">
            <OnboardingStatus />
          </div>

          <div className="hidden text-right leading-tight md:block">
            <p className="text-sm font-semibold text-brand-ink">{user.name}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>

          <span
            role="img"
            aria-label={`${user.name} profile`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-ink text-[11px] font-bold text-white ring-2 ring-white md:h-10 md:w-10 md:text-xs"
          >
            <span aria-hidden="true">{user.initials}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
