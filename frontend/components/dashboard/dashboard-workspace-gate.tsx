"use client";

import { Building2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { NoOrganization } from "@/components/organizations/no-organization";
import { useOrganizations } from "@/components/organizations/organization-provider";

/**
 * Decides what the dashboard route renders: loading, a retryable error, the
 * no-organization empty state, or the dashboard itself.
 */
export function DashboardWorkspaceGate({
  children,
}: {
  children: ReactNode;
}) {
  const { organizations, status, error, refresh } = useOrganizations();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-dash-canvas px-6">
        <p
          role="status"
          className="flex items-center gap-3 text-sm font-medium text-dash-muted"
        >
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
          />
          Loading your organizations…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-dash-canvas px-5 py-10 sm:px-8">
        <section className="w-full max-w-[460px] rounded-2xl border border-dash-line bg-white px-5 py-8 text-center shadow-card sm:px-8">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-error-soft text-error"
          >
            <Building2 className="h-6 w-6" strokeWidth={1.7} />
          </span>

          <h1 className="mt-4 font-display text-[22px] font-bold leading-7 text-brand-ink">
            We couldn&apos;t load your organizations
          </h1>
          <p role="alert" className="mt-2 text-sm leading-5 text-muted">
            {error}
          </p>

          <Button
            type="button"
            size="md"
            fullWidth={false}
            className="mt-6"
            onClick={() => void refresh()}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </Button>
        </section>
      </div>
    );
  }

  if (organizations.length === 0) {
    return <NoOrganization />;
  }

  return <>{children}</>;
}
