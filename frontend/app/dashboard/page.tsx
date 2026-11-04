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
import { OverviewStatsProvider } from "@/components/dashboard/overview-stats-provider";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { ReportingCard } from "@/components/dashboard/reporting-card";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TrendCard } from "@/components/dashboard/trend-card";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import {
  REPORTING_PERIOD,
  TOP_DISTRIBUTORS,
  TOP_PRODUCTS,
} from "@/lib/dashboard";

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

                  <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    <ReportingCard
                      id="products"
                      title="Most-reported products"
                      subtitle={`Consumer reports · ${REPORTING_PERIOD.periodLong}`}
                      columnLabel="Product / pack size"
                      items={TOP_PRODUCTS}
                      icon="product"
                      footnote="Reports are consumer submissions, not confirmed product issues."
                      actionLabel="View product reports"
                      actionHref="#recent-alerts"
                    />

                    <ReportingCard
                      id="distribution"
                      title="Most-reported distributors"
                      subtitle={`Consumer reports · ${REPORTING_PERIOD.periodLong}`}
                      columnLabel="Distributor / location"
                      items={TOP_DISTRIBUTORS}
                      icon="distributor"
                      footnote="Reported distribution context does not establish distributor responsibility."
                      actionLabel="View distributor reports"
                      actionHref="#recent-alerts"
                    />
                  </div>

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
