import { Check } from "lucide-react";
import Image from "next/image";

import { ButtonLink } from "@/components/landing/button-link";
import { LandingContainer } from "@/components/landing/container";

export function Hero() {
  return (
    <section id="top" className="bg-land-canvas">
      <LandingContainer className="grid gap-12 pb-16 pt-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:gap-10 lg:pb-20 lg:pt-20">
        <div className="max-w-[620px]">
          <p className="inline-flex rounded-full bg-[#d5eee0] px-4 py-2 text-[11px] font-bold uppercase leading-4 tracking-[0.14em] text-land-green">
            Built for Nigeria. Built on trust.
          </p>

          <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[1.04] tracking-[-0.035em] text-land-green sm:text-[52px] lg:text-[64px]">
            Before you Buy and
            <br className="hidden sm:block" /> Use. Verify.
          </h1>

          <p className="mt-6 max-w-[560px] text-[17px] leading-7 text-land-muted sm:text-lg sm:leading-8">
            A little check. A lot more confidence. Verify products, raise
            concerns and help build a more transparent marketplace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href="/check"
              withArrow
              className="w-full sm:w-auto"
            >
              Verify a Product
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Register Your Business
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm leading-6 text-land-muted">
            Early access is on the way.{" "}
            <a
              href="#waitlist"
              className="font-semibold text-land-green transition-colors hover:text-land-accent"
            >
              Join the Waitlist &rarr;
            </a>
          </p>
        </div>

        <div>
          <Image
            src="/landing/hero-illustration.webp"
            alt="Three people checking a product with a phone, a verification code and a scanned pack"
            width={1105}
            height={825}
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="mx-auto h-auto w-full max-w-[560px]"
          />

          <div className="mx-auto mt-2 flex max-w-[330px] items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_20px_45px_-32px_rgba(0,69,36,0.4)] lg:mr-6 lg:ml-auto lg:max-w-[340px]">
            <Check
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-land-accent"
              strokeWidth={3}
            />
            <div>
              <p className="text-[13px] font-semibold leading-5 text-land-ink">
                One product. One unique code.
              </p>
              <p className="text-[13px] leading-5 text-land-muted">
                Check the UVC, not just the packaging.
              </p>
            </div>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
