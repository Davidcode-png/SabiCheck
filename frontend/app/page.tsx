import type { Metadata } from "next";

import { Faq } from "@/components/landing/faq";
import { ForConsumers } from "@/components/landing/for-consumers";
import { ForManufacturers } from "@/components/landing/for-manufacturers";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Languages } from "@/components/landing/languages";
import { Marquee } from "@/components/landing/marquee";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { WaitlistSection } from "@/components/landing/waitlist-section";
import { WhySabiCheck } from "@/components/landing/why-sabicheck";

export const metadata: Metadata = {
  title: {
    absolute: "SabiCheck \u2014 Before you buy and use. Verify.",
  },
  description:
    "A little check. A lot more confidence. Verify products with a unique code, raise concerns and help build a more transparent marketplace.",
  openGraph: {
    title: "SabiCheck \u2014 Before you buy and use. Verify.",
    description:
      "Verify products with a unique code, raise concerns and help build a more transparent marketplace.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="bg-white">
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <ForConsumers />
        <ForManufacturers />
        <WhySabiCheck />
        <Languages />
        <WaitlistSection />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
