import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/require-session";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { OnboardingStatus } from "@/components/onboarding/portal-header";
import { SessionPortalHeader } from "@/components/onboarding/session-portal-header";

export const metadata: Metadata = {
  title: "Company onboarding",
};

export default function OnboardingPage() {
  return (
    <RequireSession>
      <div className="min-h-dvh bg-canvas">
        <SessionPortalHeader />

        <main className="mx-auto w-full max-w-[1152px] px-5 pb-16 pt-10 sm:px-8 md:pt-14">
          <div>
            <div className="mb-4 sm:hidden">
              <OnboardingStatus />
            </div>
            <h1 className="font-display text-[28px] font-bold leading-[1.15] text-brand-ink md:text-[32px]">
              Company Onboarding
            </h1>
            <p className="mt-2 max-w-[760px] text-[15px] leading-6 text-muted md:text-base">
              Complete your profile to unlock full regulatory check capabilities
              and start verifying products.
            </p>
          </div>

          <OnboardingForm />
        </main>
      </div>
    </RequireSession>
  );
}
