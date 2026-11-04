import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/require-session";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import { CompanySettingsScreen } from "@/components/organizations/company-settings-screen";

export const metadata: Metadata = {
  title: "Company settings",
};

export default function CompanySettingsPage() {
  return (
    <RequireSession>
      <OrganizationProvider>
        <DashboardWorkspaceGate>
          <CompanySettingsScreen />
        </DashboardWorkspaceGate>
      </OrganizationProvider>
    </RequireSession>
  );
}
