"use client";

import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { useSession } from "@/components/auth/session-provider";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { cn } from "@/lib/cn";
import {
  organizationInitials,
  organizationRoleLabel,
  organizationTypeLabel,
} from "@/lib/organizations";

type WorkspaceMenuProps = {
  variant?: "card" | "inline";
  className?: string;
};

export function WorkspaceMenu({
  variant = "card",
  className,
}: WorkspaceMenuProps) {
  const { signOut } = useSession();
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    selectOrganization,
  } = useOrganizations();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const inline = variant === "inline";
  const currentName = selectedOrganization?.name ?? "Select workspace";
  const currentType = selectedOrganization
    ? organizationTypeLabel(selectedOrganization)
    : "Workspace";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectWorkspace(organizationId: string) {
    selectOrganization(organizationId);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Current workspace: ${currentName}, ${currentType}. Switch workspace`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex items-center gap-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
          inline
            ? "h-8 w-full rounded-md px-1 text-dash-muted hover:text-brand-ink"
            : "h-[58px] w-full rounded-lg border border-dash-line bg-white px-3.5 hover:bg-dash-canvas",
        )}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate",
              inline
                ? "text-sm font-medium"
                : "text-sm font-semibold text-brand-ink",
            )}
          >
            {currentName}
          </span>
          {" "}
          {inline ? null : (
            <span className="mt-0.5 block truncate text-xs text-dash-muted">
              {currentType}
            </span>
          )}
        </span>

        {inline ? (
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronsUpDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-dash-muted"
          />
        )}
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(
            "absolute z-50 mt-2 overflow-hidden rounded-xl border border-dash-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgb(2_59_28_/_0.22)]",
            inline
              ? "right-0 w-[280px] max-w-[calc(88vw-40px)]"
              : "left-0 w-[280px] max-w-[calc(88vw-40px)]",
          )}
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-dash-muted">
            Organizations
          </p>

          <ul className="space-y-0.5">
            {organizations.map((organization) => {
              const active = organization.id === selectedOrganizationId;

              return (
                <li key={organization.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectWorkspace(organization.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                      active
                        ? "bg-dash-soft"
                        : "hover:bg-dash-canvas",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-bold text-brand-ink ring-1 ring-dash-line"
                    >
                      {organizationInitials(organization.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-brand-ink">
                        {organization.name}
                      </span>
                      <span className="block truncate text-[11px] text-label">
                        {organizationTypeLabel(organization)} ·{" "}
                        {organizationRoleLabel(organization.role)}
                      </span>
                    </span>
                    {active ? (
                      <Check
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-brand"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-1 space-y-0.5 border-t border-dash-line pt-1">
            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <Plus
                aria-hidden="true"
                className="h-4 w-4 text-dash-muted"
                strokeWidth={2}
              />
              Create organization
            </Link>

            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <Settings
                aria-hidden="true"
                className="h-4 w-4 text-dash-muted"
                strokeWidth={1.8}
              />
              Company settings
            </Link>
          </div>

          <p className="px-2.5 pb-1 pt-2 text-[11px] leading-4 text-dash-muted">
            {organizations.length === 1
              ? "1 organization connected to this account."
              : `${organizations.length} organizations connected to this account.`}
          </p>

          <div className="mt-1 border-t border-dash-line pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <LogOut
                aria-hidden="true"
                className="h-4 w-4 text-dash-muted"
                strokeWidth={1.8}
              />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
