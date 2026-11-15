import { Check } from "lucide-react";
import Image from "next/image";

import { ButtonLink } from "@/components/landing/button-link";
import { CheckItem } from "@/components/landing/check-item";
import { LandingContainer } from "@/components/landing/container";
import { SectionLabel } from "@/components/landing/section-label";
import { WorkspaceMock } from "@/components/landing/workspace-mock";

const FEATURES = [
  {
    title: "Register products & batches",
    description: "Register NAFDAC-verified products and respective batches",
  },
  {
    title: "Purchase Unique Verification Codes",
    description:
      "Purchase and manage unique codes for your products and batches",
  },
  {
    title: "Allocate to distributors",
    description: "Connect distribution activity to your product batches.",
  },
  {
    title: "Understand verification activity",
    description: "See analytics and review incoming consumer reports.",
  },
] as const;

export function ForManufacturers() {
  return (
    <section
      id="manufacturers"
      className="scroll-mt-24 bg-white py-20 lg:py-28"
    >
      <LandingContainer>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <div className="rounded-3xl bg-land-canvas p-4 lg:hidden">
              <Image
                src="/landing/manufacturer-illustration.webp"
                alt="Two colleagues reviewing product batches and verification activity at a desk"
                width={870}
                height={710}
                sizes="(max-width: 1024px) 100vw, 342px"
                className="mx-auto h-auto w-full"
              />
              <div className="mt-2 flex items-start gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-land-accent"
                  strokeWidth={3}
                />
                <div>
                  <p className="text-sm font-semibold text-land-ink">
                    From batch to buyer.
                  </p>
                  <p className="mt-0.5 text-[13px] leading-5 text-land-muted">
                    Keep your product journey in view.
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <WorkspaceMock />
            </div>
          </div>

          <div className="max-w-[540px]">
            <SectionLabel>03 / For manufacturers</SectionLabel>

            <h2 className="mt-6 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px] lg:text-[48px]">
              Build trust into
              <br />
              every batch.
            </h2>

            <p className="mt-5 text-[17px] leading-7 text-land-muted">
              Give your products a verifiable identity. Bring product activity,
              distribution and consumer feedback into one clear view.
            </p>

            <ul className="mt-8 space-y-5">
              {FEATURES.map((feature) => (
                <CheckItem key={feature.title} {...feature} />
              ))}
            </ul>

            <ButtonLink
              href="/signup"
              withArrow
              className="mt-8 w-full sm:w-auto"
            >
              Register Your Business
            </ButtonLink>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
