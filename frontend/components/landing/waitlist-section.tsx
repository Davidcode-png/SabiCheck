import { LandingContainer } from "@/components/landing/container";
import { SectionLabel } from "@/components/landing/section-label";
import { WaitlistForm } from "@/components/landing/waitlist-form";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="scroll-mt-24 bg-land-canvas py-20 lg:py-24">
      <LandingContainer>
        <div className="grid gap-10 rounded-[28px] bg-land-mint p-6 sm:p-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:p-16">
          <div>
            <SectionLabel size="xs">
              Let&rsquo;s build a more trusted marketplace
            </SectionLabel>

            <h2 className="mt-4 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px] lg:text-[48px]">
              Be part of
              <br />
              the first check.
            </h2>

            <p className="mt-5 max-w-[420px] text-[17px] leading-7 text-land-green/80">
              For the everyday buyer. The growing business. And everyone who
              believes trust should be easier.
            </p>

            <p className="mt-4 text-[15px] font-medium leading-6 text-land-green">
              Join the waitlist for launch news and early-access updates.
            </p>
          </div>

          <WaitlistForm />
        </div>
      </LandingContainer>
    </section>
  );
}
