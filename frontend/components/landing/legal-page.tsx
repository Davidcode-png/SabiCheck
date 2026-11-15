import Link from "next/link";
import type { ReactNode } from "react";

import { LandingContainer } from "@/components/landing/container";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white">
      <SiteHeader />
      <main className="bg-white py-16 lg:py-24">
        <LandingContainer>
          <div className="mx-auto max-w-[760px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-land-green">
              SabiCheck
            </p>
            <h1 className="mt-4 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px]">
              {title}
            </h1>
            <div className="mt-6 space-y-5 text-[16px] leading-7 text-land-muted">
              {children}
            </div>
            <Link
              href="/"
              className="mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-land-green transition-colors hover:text-land-accent"
            >
              <span aria-hidden="true">&larr;</span>
              Back to home
            </Link>
          </div>
        </LandingContainer>
      </main>
      <SiteFooter />
    </div>
  );
}
