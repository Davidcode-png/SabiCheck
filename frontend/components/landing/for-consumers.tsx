import { ButtonLink } from "@/components/landing/button-link";
import { CheckItem } from "@/components/landing/check-item";
import { LandingContainer } from "@/components/landing/container";
import { ConsumerReportMock } from "@/components/landing/consumer-report-mock";
import { SectionLabel } from "@/components/landing/section-label";

const BENEFITS = [
  {
    title: "Verify before you decide",
    description: "Use a QR code and UVC, or verify with USSD.",
  },
  {
    title: "Speak up about suspicious products",
    description: "Share product details and tell us what concerns you.",
  },
  {
    title: "Add evidence on your terms",
    description:
      "Photos are optional for web reports only. Never required for verification.",
  },
] as const;

export function ForConsumers() {
  return (
    <section
      id="consumers"
      className="scroll-mt-24 bg-land-canvas py-20 lg:py-28"
    >
      <LandingContainer className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
        <div className="max-w-[500px]">
          <SectionLabel>02 / For consumers</SectionLabel>

          <h2 className="mt-6 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px] lg:text-[48px]">
            Your confidence.
            <br />
            Your voice.
          </h2>

          <p className="mt-5 text-[17px] leading-7 text-land-muted">
            You deserve to know more about what you buy. SabiCheck puts product
            information and the power to speak up in your hands.
          </p>

          <ul className="mt-8 space-y-5">
            {BENEFITS.map((benefit) => (
              <CheckItem key={benefit.title} {...benefit} />
            ))}
          </ul>

          <ButtonLink href="/check" withArrow className="mt-8 w-full sm:w-auto">
            Verify a Product
          </ButtonLink>
        </div>

        <div className="mx-auto w-full max-w-[620px]">
          <ConsumerReportMock />
        </div>
      </LandingContainer>
    </section>
  );
}
