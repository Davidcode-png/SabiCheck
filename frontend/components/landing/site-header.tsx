"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/landing/button-link";
import { LandingContainer } from "@/components/landing/container";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Consumers", href: "#consumers" },
  { label: "Manufacturers", href: "#manufacturers" },
  { label: "About", href: "#why-sabicheck" },
  { label: "FAQs", href: "#faqs" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-land-line/70 bg-white/95 backdrop-blur">
      <LandingContainer className="flex h-[78px] items-center justify-between gap-6 lg:h-[100px]">
        <Logo
          tagline="Real products. Safer choices."
          markClassName="h-9 w-9 lg:h-11 lg:w-11"
          wordmarkClassName="text-[20px] lg:text-[26px]"
          taglineClassName="text-[7px] tracking-[0.12em] lg:text-[9px] lg:tracking-[0.16em]"
        />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-land-ink transition-colors hover:text-land-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <Link
            href="/signin"
            className="text-[15px] font-medium text-land-ink transition-colors hover:text-land-accent"
          >
            Sign In
          </Link>
          <ButtonLink href="/signup">Get Started</ButtonLink>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/signin"
            className="shrink-0 whitespace-nowrap px-2 py-2 text-sm font-semibold text-land-ink"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-land-green transition-colors hover:bg-land-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-land-green/15"
          >
            {open ? (
              <X aria-hidden="true" className="h-6 w-6" />
            ) : (
              <Menu aria-hidden="true" className="h-6 w-6" />
            )}
          </button>
        </div>
      </LandingContainer>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-land-line bg-white lg:hidden"
        >
          <LandingContainer className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[15px] font-medium text-land-ink transition-colors hover:bg-land-canvas"
              >
                {link.label}
              </a>
            ))}
            <ButtonLink
              href="/signup"
              className="mt-3 w-full"
              onClick={() => setOpen(false)}
            >
              Get Started
            </ButtonLink>
          </LandingContainer>
        </div>
      ) : null}
    </header>
  );
}
