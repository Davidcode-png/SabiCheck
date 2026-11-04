"use client";

import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useSession } from "@/components/auth/session-provider";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ReviewNote } from "@/components/dashboard/review-note";
import { WorkspaceMenu } from "@/components/dashboard/workspace-menu";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { SETTINGS_NAV_ITEM } from "@/lib/dashboard";
import { organizationRoleLabel } from "@/lib/organizations";
import { userDisplayName, userInitials } from "@/lib/user";

export function DashboardSidebar() {
  const { user } = useSession();
  const { selectedOrganization } = useOrganizations();
  const name = user ? userDisplayName(user) : "SabiCheck user";
  const initials = user ? userInitials(user) : "SC";
  const role = selectedOrganization
    ? organizationRoleLabel(selectedOrganization.role)
    : "Workspace member";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[247px] border-r border-dash-line bg-white xl:flex xl:flex-col">
      <div className="flex h-full flex-col px-6 pb-6 pt-7">
        <div className="shrink-0">
          <Link
            href="/dashboard"
            aria-label="SabiCheck dashboard home"
            className="inline-flex w-fit rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <Image
              src="/brand/logo-full.svg"
              alt="SabiCheck"
              width={520}
              height={150}
              loading="eager"
              fetchPriority="high"
              className="h-[58px] w-auto"
            />
          </Link>

          <WorkspaceMenu className="mt-9" />
        </div>

        <div className="mt-7 min-h-0 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-dash-muted">
            Workspace
          </p>

          <DashboardNav className="mt-2.5" />

          <div className="mt-8 border-t border-dash-line pt-2">
            <Link
              href={SETTINGS_NAV_ITEM.href}
              className="group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-brand-ink/80 transition-colors hover:bg-dash-soft/70 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <SlidersHorizontal
                aria-hidden="true"
                strokeWidth={1.8}
                className="h-[18px] w-[18px] shrink-0 text-dash-muted group-hover:text-brand-ink"
              />
              <span className="truncate">{SETTINGS_NAV_ITEM.label}</span>
            </Link>
          </div>

          <ReviewNote className="mt-8" />
        </div>

        <div className="shrink-0 pt-8">
          <div className="flex items-center gap-3">
            <span
              role="img"
              aria-label={`${name} profile`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dash-tint text-[10px] font-bold text-brand-ink"
            >
              <span aria-hidden="true">{initials}</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-5 text-brand-ink">
                {name}
              </p>
              <p className="truncate text-xs leading-4 text-dash-muted">
                {role}
              </p>
            </div>
          </div>

          {/* TODO: point this at the help centre once it exists. */}
          <Link
            href="#"
            className="mt-3 inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            Help &amp; documentation
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
