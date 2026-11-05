import type { Metadata } from "next";
import { Suspense } from "react";

import { RequireSession } from "@/components/auth/require-session";
import { DashboardHeading } from "@/components/dashboard/dashboard-heading";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { MobileDashboardHeader } from "@/components/dashboard/mobile-dashboard-header";
import { OnboardingNotice } from "@/components/dashboard/onboarding-notice";
import { OverviewNotice } from "@/components/dashboard/overview-notice";
import { OverviewReportingCards } from "@/components/dashboard/overview-reporting-cards";
import { OverviewStatsProvider } from "@/components/dashboard/overview-stats-provider";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TrendCard } from "@/components/dashboard/trend-card";
import { OrganizationProvider } from "@/components/organizations/organization-provider";

export const metadata: Metadata = {
  title: "Overview",
};

export default function DashboardPage() {
  return (
    <RequireSession>
      <OrganizationProvider>
        <DashboardWorkspaceGate>
          <OverviewStatsProvider>
            <div className="min-h-dvh bg-dash-canvas">
              <DashboardSidebar />
              <MobileDashboardHeader />

              <div className="xl:pl-[247px]">
                <DashboardTopbar />

                <main className="px-5 pb-8 pt-7 sm:px-8 xl:px-10 xl:pt-6">
                  <Suspense fallback={null}>
                    <OnboardingNotice />
                  </Suspense>

                  <DashboardHeading />

                  <div className="mt-6 xl:mt-7">
                    <StatCards />
                  </div>

                  <OverviewNotice />
                  <TrendCard />

                  <OverviewReportingCards />

                  <RecentAlerts />

                  <footer className="mt-8 pb-2 text-xs leading-5 text-dash-muted xl:mt-9">
                    SabiCheck · Manufacturer workspace · Reporting dates and
                    times use WAT (UTC+1).
                  </footer>
                </main>
              </div>
            </div>
          </OverviewStatsProvider>
        </DashboardWorkspaceGate>
      </OrganizationProvider>
    </RequireSession>
  );
}
