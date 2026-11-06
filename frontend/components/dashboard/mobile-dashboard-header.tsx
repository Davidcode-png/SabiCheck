"use client";

import { ArrowUpRight, Menu, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { useSession } from "@/components/auth/session-provider";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ReviewNote } from "@/components/dashboard/review-note";
import { WorkspaceAssistant } from "@/components/dashboard/workspace-assistant";
import { WorkspaceMenu } from "@/components/dashboard/workspace-menu";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { SETTINGS_NAV_ITEM } from "@/lib/dashboard";
import {
  organizationRoleLabel,
  organizationTypeLabel,
} from "@/lib/organizations";
import { userDisplayName, userInitials } from "@/lib/user";

export function MobileDashboardHeader({
  sectionLabel = "Overview",
}: {
  sectionLabel?: string;
}) {
  const { user } = useSession();
  const { selectedOrganization } = useOrganizations();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const name = user ? userDisplayName(user) : "SabiCheck user";
  const initials = user ? userInitials(user) : "SC";
  const role = selectedOrganization
    ? organizationRoleLabel(selectedOrganization.role)
    : "Workspace member";

  function openMenu() {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    setOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  function handleClose() {
    setOpen(false);
    document.body.style.overflow = "";
  }

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) closeMenu();
  }

  return (
    <div className="xl:hidden">
      <header className="flex h-[87px] items-center justify-between gap-4 border-b border-dash-line bg-white px-5">
        <Link
          href="/dashboard"
          aria-label="SabiCheck dashboard home"
          className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          <Image
            src="/brand/logo-full.svg"
            alt="SabiCheck"
            width={520}
            height={150}
            loading="eager"
            fetchPriority="high"
            className="h-12 w-auto"
          />
        </Link>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Open dashboard navigation"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          <Menu aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
        </button>
      </header>

      <div className="flex h-11 items-center justify-between gap-4 border-b border-dash-line bg-white px-5">
        <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-brand-ink">
          {sectionLabel}
        </p>
        <div className="flex min-w-0 items-center justify-end gap-1">
          <WorkspaceAssistant
            key={selectedOrganization?.id ?? "no-workspace"}
            variant="mobile"
          />
          <WorkspaceMenu variant="inline" className="max-w-[190px]" />
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Dashboard navigation"
        onClose={handleClose}
        onClick={handleDialogClick}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(340px,88vw)] max-w-none border-0 border-r border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35 open:flex open:flex-col"
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto px-5 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              onClick={closeMenu}
              aria-label="SabiCheck dashboard home"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <Image
                src="/brand/logo-full.svg"
                alt="SabiCheck"
                width={520}
                height={150}
                className="h-11 w-auto"
              />
            </Link>

            <button
              type="button"
              autoFocus
              onClick={closeMenu}
              aria-label="Close dashboard navigation"
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <X aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <WorkspaceMenu className="mt-6" />

          <DashboardNav className="mt-7" onNavigate={closeMenu} />

          <div className="mt-6 border-t border-dash-line pt-2">
            <Link
              href={SETTINGS_NAV_ITEM.href}
              onClick={closeMenu}
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

          <ReviewNote className="mt-7" />

          <div className="mt-auto pt-8">
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

            {selectedOrganization ? (
              <p className="mt-3 truncate text-[11px] leading-4 text-dash-muted">
                {selectedOrganization.name} ·{" "}
                {organizationTypeLabel(selectedOrganization)}
              </p>
            ) : null}

            {/* TODO: point this at the help centre once it exists. */}
            <Link
              href="#"
              onClick={closeMenu}
              className="mt-2 inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              Help &amp; documentation
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </dialog>
    </div>
  );
}
