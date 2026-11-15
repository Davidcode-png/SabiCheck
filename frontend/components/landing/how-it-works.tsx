import { LandingContainer } from "@/components/landing/container";
import { SectionLabel } from "@/components/landing/section-label";

const STEPS = [
  {
    number: "01",
    title: "Scan the QR code",
    description:
      "Scan the uniform SabiCheck QR on the pack to open the verification page.",
    note: "QR opens the page.",
  },
  {
    number: "02",
    title: "Scratch and enter the unique code",
    description:
      "Find the product\u2019s unique verification code (UVC) and enter it on the page.",
    note: "The UVC identifies the product.",
  },
  {
    number: "03",
    title: "Read your result",
    description:
      "View the verification response and available product information before you decide.",
    note: "Check first. Choose confidently.",
  },
] as const;

const USSD_STEPS = [
  "Dial the SabiCheck shortcode",
  "Follow the prompts and enter your UVC",
  "Receive the verification response",
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-white py-20 lg:py-28"
    >
      <LandingContainer>
        <SectionLabel>01 / How it works</SectionLabel>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
          <h2 className="font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px] lg:text-[48px]">
            A simple check.
            <br />
            A more informed choice.
          </h2>

          <div>
            <p className="max-w-[480px] text-[17px] leading-7 text-land-muted">
              From the shelf to your phone, get product information in a few
              straightforward steps.
            </p>
            <p className="mt-3 text-[15px] font-semibold text-land-ink">
              No app download needed.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-start">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-2xl bg-land-canvas p-7">
              <div className="flex items-center gap-5">
                <span className="font-display text-[30px] font-extrabold leading-none text-land-accent">
                  {step.number}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-[#d7e5db]" />
              </div>
              <h3 className="mt-6 font-display text-[22px] font-bold leading-7 text-land-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-[15px] leading-6 text-land-muted">
                {step.description}
              </p>
              <p className="mt-5 text-[13px] font-semibold text-land-ink">
                {step.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 rounded-2xl bg-land-green px-6 py-9 text-white sm:px-7 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
              No internet? No problem.
            </p>
            <h3 className="mt-4 font-display text-[26px] font-bold leading-8 sm:text-[30px] sm:leading-9 lg:text-[32px]">
              Your code. Any phone.
            </h3>
            <p className="mt-3 max-w-[400px] text-[15px] leading-6 text-white/75">
              USSD verification is designed for everyday access, without mobile
              data.
            </p>
          </div>

          <div className="lg:pt-1">
            <ol className="space-y-1.5 text-[15px] leading-6">
              {USSD_STEPS.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-semibold">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13px] leading-6 text-white/65">
              Shortcode to be announced at launch.
              <br />
              USSD does not support photo uploads.
            </p>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
