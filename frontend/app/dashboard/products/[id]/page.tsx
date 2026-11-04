import type { Metadata } from "next";

import { RequireSession } from "@/components/auth/require-session";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import { ProductDetailsScreen } from "@/components/products/product-details-screen";

export const metadata: Metadata = {
  title: "Product details",
};

type ProductDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;

  return (
    <RequireSession>
      <OrganizationProvider>
        <DashboardWorkspaceGate>
          <ProductDetailsScreen id={id} />
        </DashboardWorkspaceGate>
      </OrganizationProvider>
    </RequireSession>
  );
}
