import { LandingContainer } from "@/components/landing/container";
import { SectionLabel } from "@/components/landing/section-label";

const PILLARS = [
  {
    number: "01",
    title: "Transparency",
    description: "Make product information easier to find and understand.",
  },
  {
    number: "02",
    title: "Empowerment",
    description: "Give every consumer a way to check and speak up.",
  },
  {
    number: "03",
    title: "Traceability",
    description: "Connect products, batches and distributor activity.",
  },
  {
    number: "04",
    title: "Accountability",
    description: "Bring consumer concerns into the conversation.",
  },
] as const;

export function WhySabiCheck() {
  return (
    <section
      id="why-sabicheck"
      className="scroll-mt-24 bg-land-green py-20 text-white lg:py-24"
    >
      <LandingContainer>
        <SectionLabel tone="mint">04 / Why SabiCheck</SectionLabel>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 className="font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px] lg:text-[48px]">
            Better information.
            <br />
            Stronger trust.
          </h2>

          <div className="lg:pt-1">
            <p className="font-display text-[20px] font-semibold leading-7 text-white sm:text-[22px]">
              A more transparent marketplace starts with all of us.
            </p>
            <p className="mt-3 max-w-[480px] text-[15px] leading-6 text-white/70">
              We&rsquo;re connecting consumers and manufacturers around a shared
              goal: more informed decisions about everyday products.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {PILLARS.map((pillar) => (
            <div key={pillar.number}>
              <p className="text-[12px] font-medium text-land-mint">
                {pillar.number}
              </p>
              <span
                aria-hidden="true"
                className="mt-3 block h-px w-full bg-white/20"
              />
              <h3 className="mt-4 font-display text-[22px] font-bold leading-7">
                {pillar.title}
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-white/70">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
