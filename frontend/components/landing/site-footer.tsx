import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LandingContainer } from "@/components/landing/container";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/sabicheck" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/sabicheck" },
  { label: "X", href: "https://x.com/sabicheck" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-white py-12 lg:py-16">
      <LandingContainer className="flex flex-col items-center gap-10 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
        <div>
          <Logo
            tagline="Real products. Safer choices."
            markClassName="h-10 w-10 lg:h-11 lg:w-11"
            wordmarkClassName="text-[22px] lg:text-[25px]"
            className="justify-center lg:justify-start"
          />
          <p className="mt-5 text-[15px] leading-6 text-land-muted">
            A little check. A lot more confidence.
          </p>
          <div className="mt-6 hidden items-center justify-center gap-6 text-[13px] text-land-muted lg:flex lg:justify-start">
            <Link href="/privacy" className="hover:text-land-green">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-land-green">
              Terms
            </Link>
          </div>
        </div>

        <div className="lg:text-right">
          <a
            href="mailto:hello@sabicheck.com"
            className="text-[15px] font-semibold text-land-ink transition-colors hover:text-land-green"
          >
            hello@sabicheck.com
          </a>
          <div className="mt-4 flex items-center justify-center gap-6 text-[13px] text-land-ink lg:justify-end">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-land-green"
              >
                {social.label}
                <span aria-hidden="true">&rarr;</span>
              </a>
            ))}
          </div>
        </div>

        <div className="-mt-5 flex items-center justify-center gap-6 text-[13px] text-land-muted lg:hidden">
          <Link href="/privacy" className="hover:text-land-green">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-land-green">
            Terms
          </Link>
        </div>
      </LandingContainer>
    </footer>
  );
}
