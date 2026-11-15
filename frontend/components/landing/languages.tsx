import { ChevronDown, Globe } from "lucide-react";

import { LandingContainer } from "@/components/landing/container";
import { SectionLabel } from "@/components/landing/section-label";

const LANGUAGES = [
  { name: "English", note: "Clear and familiar" },
  { name: "Yoruba", note: "Rooted in connection" },
  { name: "Hausa", note: "Reaching more voices" },
  { name: "Igbo", note: "Closer to community" },
  { name: "Nigerian Pidgin", note: "The way we connect" },
] as const;

export function Languages() {
  return (
    <section id="languages" className="scroll-mt-24 bg-white py-20 lg:py-24">
      <LandingContainer>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
          <div>
            <SectionLabel>Made for the way we speak</SectionLabel>
            <h2 className="mt-4 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px] lg:text-[48px]">
              Trust speaks your language.
            </h2>
            <p className="mt-4 max-w-[620px] text-[17px] leading-7 text-land-muted">
              We&rsquo;re planning support for five languages, so more people
              can check with confidence.
            </p>
          </div>

          <div className="lg:pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-land-muted">
              Planned language experience
            </p>
            <div className="relative mt-3">
              <Globe
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-land-green"
                strokeWidth={1.8}
              />
              <select
                aria-label="Planned language experience"
                defaultValue="english-uk"
                className="h-11 appearance-none rounded-full bg-land-canvas pl-10 pr-10 text-sm font-medium text-land-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-land-green/15"
              >
                <option value="english-uk">English (UK)</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-land-green"
                strokeWidth={2}
              />
            </div>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LANGUAGES.map((language) => (
            <li
              key={language.name}
              className="rounded-xl bg-land-canvas px-6 py-6"
            >
              <p className="font-display text-[17px] font-bold text-land-green">
                {language.name}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-land-muted">
                {language.note}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[13px] leading-5 text-land-muted">
          Planned support &middot; Availability will be confirmed as we roll
          out.
        </p>
      </LandingContainer>
    </section>
  );
}
