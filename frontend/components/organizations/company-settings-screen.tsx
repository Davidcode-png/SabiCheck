"use client";

import { CheckCircle2, Save, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardBreadcrumbItem } from "@/components/dashboard/dashboard-topbar";
import { MobileDashboardHeader } from "@/components/dashboard/mobile-dashboard-header";
import { useOrganizations } from "@/components/organizations/organization-provider";
import { ApiError } from "@/lib/api/client";
import { organizationApi } from "@/lib/api/organizations";
import { cn } from "@/lib/cn";

const BREADCRUMB: ReadonlyArray<DashboardBreadcrumbItem> = [
  { label: "Workspace", href: "/dashboard" },
  { label: "Company settings" },
];

export function CompanySettingsScreen() {
  const { selectedOrganization, status, refresh } = useOrganizations();
  const [draft, setDraft] = useState<{
    organizationId: string | null;
    prefix: string;
  }>({ organizationId: null, prefix: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const prefix =
    draft.organizationId === selectedOrganization?.id
      ? draft.prefix
      : (selectedOrganization?.manufacturer_prefix ?? "");

  const canManage =
    selectedOrganization?.role === "Owner" ||
    selectedOrganization?.role === "Admin";
  const normalizedPrefix = prefix.trim().toUpperCase();
  const validPrefix = /^[A-Z0-9]{3}$/.test(normalizedPrefix);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOrganization || !validPrefix || saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await organizationApi.update(selectedOrganization.id, {
        manufacturer_prefix: normalizedPrefix,
      });
      await refresh();
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We could not save your settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-dash-canvas">
      <DashboardSidebar />
      <MobileDashboardHeader sectionLabel="Company settings" />

      <div className="xl:pl-[247px]">
        <DashboardTopbar breadcrumb={BREADCRUMB} />

        <main className="px-5 pb-8 pt-7 sm:px-8 xl:px-10 xl:pt-8">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
              Company settings
            </h1>
            <p className="mt-1.5 max-w-[640px] text-[15px] leading-6 text-dash-muted">
              Manage the manufacturer details used across your verification
              codes and product registry.
            </p>

            <section className="mt-7 max-w-[720px] rounded-xl border border-dash-line bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-soft text-brand-ink"
                >
                  <SlidersHorizontal className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold leading-6 text-brand-ink">
                    Manufacturer code prefix
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-dash-muted">
                    Every verification code starts with this three-character
                    prefix, followed by 8 random digits. For example,{" "}
                    <span className="font-mono font-semibold text-brand-ink">
                      {validPrefix ? normalizedPrefix : "MAT"}04929302
                    </span>
                    .
                  </p>
                </div>
              </div>

              {status === "loading" ? (
                <p className="mt-6 text-sm text-dash-muted">
                  Loading company details…
                </p>
              ) : !selectedOrganization ? (
                <p className="mt-6 text-sm text-dash-muted">
                  Create an organization before changing company settings.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs leading-5 text-dash-muted">
                        Organization
                      </p>
                      <p className="mt-0.5 break-words text-sm font-semibold text-brand-ink">
                        {selectedOrganization.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs leading-5 text-dash-muted">Role</p>
                      <p className="mt-0.5 text-sm font-semibold text-brand-ink">
                        {selectedOrganization.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor="manufacturer-prefix"
                      className="text-sm font-semibold leading-5 text-label"
                    >
                      Three-character prefix
                    </label>
                    <input
                      id="manufacturer-prefix"
                      name="manufacturerPrefix"
                      value={prefix}
                      onChange={(event) => {
                        setDraft({
                          organizationId: selectedOrganization.id,
                          prefix: event.target.value
                            .toUpperCase()
                            .slice(0, 3),
                        });
                        setSaved(false);
                        setError(null);
                      }}
                      disabled={!canManage || saving}
                      maxLength={3}
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={!validPrefix || undefined}
                      aria-describedby="manufacturer-prefix-hint"
                      className="mt-2 h-[50px] w-full max-w-[220px] rounded-xl border border-line bg-white px-4 font-mono text-lg font-semibold uppercase tracking-[0.18em] text-ink shadow-[0_1px_2px_rgb(16_24_40_/_0.02)] outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/10 disabled:bg-canvas disabled:text-dash-muted"
                    />
                    <p
                      id="manufacturer-prefix-hint"
                      className="mt-1.5 text-[13px] leading-5 text-muted"
                    >
                      Use 3 letters or numbers. Existing codes keep the prefix
                      they were generated with.
                    </p>
                  </div>

                  {!canManage ? (
                    <p className="mt-4 rounded-xl bg-dash-soft px-3.5 py-3 text-[13px] leading-5 text-dash-muted">
                      Only Owners and Admins can change this setting.
                    </p>
                  ) : null}

                  {error ? (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error"
                    >
                      {error}
                    </div>
                  ) : null}

                  {saved ? (
                    <div
                      role="status"
                      className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-brand/5 px-3.5 py-3 text-sm leading-5 text-brand-ink"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      />
                      Manufacturer prefix saved.
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!canManage || !validPrefix || saving}
                    aria-busy={saving || undefined}
                    className={cn(
                      "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
                    )}
                  >
                    {saving ? (
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                      />
                    ) : (
                      <Save aria-hidden="true" className="h-4 w-4" />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </form>
              )}
            </section>

            <footer className="mt-8 pb-2 text-xs leading-5 text-dash-muted xl:mt-9">
              SabiCheck · Manufacturer workspace · Dates and times use WAT
              (UTC+1).
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
