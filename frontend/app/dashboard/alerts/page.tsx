import type { Metadata } from "next";

import { AlertsScreen } from "@/components/alerts/alerts-screen";
import { RequireSession } from "@/components/auth/require-session";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardBreadcrumbItem } from "@/components/dashboard/dashboard-topbar";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { MobileDashboardHeader } from "@/components/dashboard/mobile-dashboard-header";
import { OrganizationProvider } from "@/components/organizations/organization-provider";

export const metadata: Metadata = {
  title: "Alerts",
};

const BREADCRUMB: ReadonlyArray<DashboardBreadcrumbItem> = [
  { label: "Workspace", href: "/dashboard" },
  { label: "Alerts" },
];

export default function AlertsPage() {
  return (
    <RequireSession>
      <OrganizationProvider>
        <DashboardWorkspaceGate>
          <div className="min-h-dvh bg-dash-canvas">
            <DashboardSidebar />
            <MobileDashboardHeader sectionLabel="Alerts" />

            <div className="xl:pl-[247px]">
              <DashboardTopbar breadcrumb={BREADCRUMB} />

              <main className="px-5 pb-8 pt-7 sm:px-8 xl:px-10 xl:pt-8">
                <div className="min-w-0">
                  <AlertsScreen />

                  <footer className="mt-8 pb-2 text-xs leading-5 text-dash-muted xl:mt-9">
                    SabiCheck · Manufacturer workspace · Dates and times use WAT
                    (UTC+1).
                  </footer>
                </div>
              </main>
            </div>
          </div>
        </DashboardWorkspaceGate>
      </OrganizationProvider>
    </RequireSession>
  );
}
