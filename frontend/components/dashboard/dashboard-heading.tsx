"use client";

import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { useOrganizations } from "@/components/organizations/organization-provider";

export function DashboardHeading() {
  const { selectedOrganization } = useOrganizations();
  const workspaceName = selectedOrganization?.name ?? "your workspace";

  return (
    <div className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[30px] font-bold leading-9 text-brand-ink xl:text-[34px] xl:leading-[42px]">
          Overview
        </h1>
        <p className="mt-1.5 text-[15px] leading-6 text-dash-muted">
          Verification activity for {workspaceName}.
        </p>
      </div>

      <div className="xl:mt-6">
        <DashboardActions />
      </div>
    </div>
  );
}
