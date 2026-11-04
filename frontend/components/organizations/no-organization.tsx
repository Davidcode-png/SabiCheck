"use client";

import { Building2, LogOut, Plus } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/components/auth/session-provider";
import { Logo } from "@/components/brand/logo";
import { userDisplayName, userInitials } from "@/lib/user";

/**
 * Full-page gate shown when the signed-in user has no organization yet.
 * The create action carries them into the existing onboarding flow.
 */
export function NoOrganization() {
  const { user, signOut } = useSession();
  const name = user ? userDisplayName(user) : "SabiCheck user";
  const initials = user ? userInitials(user) : "SC";

  return (
    <div className="min-h-dvh bg-dash-canvas">
      <header className="border-b border-dash-line bg-white">
        <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8 md:h-[77px]">
          <Logo
            href={null}
            priority
            tagline="Business Portal"
            markClassName="h-9 w-9 md:h-10 md:w-10"
          />

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="hidden min-w-0 text-right leading-tight sm:block">
                <p className="max-w-[220px] truncate text-sm font-semibold text-brand-ink">
                  {name}
                </p>
                <p className="max-w-[220px] truncate text-xs text-muted">
                  {user.email}
                </p>
              </div>
            ) : null}

            <span
              role="img"
              aria-label={`${name} profile`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-ink text-[11px] font-bold text-white ring-2 ring-white md:h-10 md:w-10 md:text-xs"
            >
              <span aria-hidden="true">{initials}</span>
            </span>

            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <LogOut
                aria-hidden="true"
                className="h-4 w-4 text-dash-muted"
                strokeWidth={1.8}
              />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-10 sm:px-8 md:pt-16">
        <section className="rounded-2xl border border-dash-line bg-white px-5 py-10 text-center shadow-card sm:px-10 md:py-12">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"
          >
            <Building2 className="h-7 w-7" strokeWidth={1.7} />
          </span>

          <h1 className="mt-5 font-display text-[26px] font-bold leading-[1.2] text-brand-ink sm:text-[30px]">
            You don&apos;t have an organization yet
          </h1>

          <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-6 text-muted">
            Create your organization to unlock regulatory checks, product
            verification, and workspace reporting. You&apos;ll become its owner.
          </p>

          <Link
            href="/onboarding"
            className="group mx-auto mt-7 flex w-full max-w-[400px] flex-col items-center rounded-2xl border-2 border-dashed border-line-strong bg-canvas/30 px-6 py-7 transition-colors hover:border-brand hover:bg-brand-soft/40 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_18px_-8px_rgb(0_127_69_/_0.7)] transition-colors group-hover:bg-brand-hover"
            >
              <Plus className="h-6 w-6" strokeWidth={2.4} />
            </span>
            <span className="mt-3.5 text-[15px] font-semibold leading-6 text-brand-ink">
              Create an organization
            </span>
            <span className="mt-1 text-xs leading-5 text-muted">
              Add your business details and supporting documents.
            </span>
          </Link>

          <p className="mx-auto mt-6 max-w-[420px] text-xs leading-5 text-dash-muted">
            Once created, you can switch between organizations from the
            workspace menu on your dashboard.
          </p>
        </section>
      </main>
    </div>
  );
}
