import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/require-session";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import { ProductCodesScreen } from "@/components/products/product-codes-screen";

export const metadata: Metadata = {
  title: "Verification codes",
};

type ProductCodesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductCodesPage({
  params,
}: ProductCodesPageProps) {
  const { id } = await params;

  return (
    <RequireSession>
      <OrganizationProvider>
        <DashboardWorkspaceGate>
          <ProductCodesScreen id={id} />
        </DashboardWorkspaceGate>
      </OrganizationProvider>
    </RequireSession>
  );
}
