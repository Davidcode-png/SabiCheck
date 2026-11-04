import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RequireSession } from "@/components/auth/require-session";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardBreadcrumbItem } from "@/components/dashboard/dashboard-topbar";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { MobileDashboardHeader } from "@/components/dashboard/mobile-dashboard-header";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import { RegisterProductForm } from "@/components/products/register-product-form";

export const metadata: Metadata = {
  title: "Register product",
};

const BREADCRUMB: ReadonlyArray<DashboardBreadcrumbItem> = [
  { label: "Workspace", href: "/dashboard" },
  { label: "Products & codes", href: "/dashboard/products" },
  { label: "Register product" },
];

export default function RegisterProductPage() {
  return (
    <RequireSession>
      <OrganizationProvider>
        <DashboardWorkspaceGate>
          <div className="min-h-dvh bg-dash-canvas">
            <DashboardSidebar />
            <MobileDashboardHeader sectionLabel="Products & codes" />

            <div className="xl:pl-[247px]">
              <DashboardTopbar breadcrumb={BREADCRUMB} />

              <main className="px-5 pb-8 pt-7 sm:px-8 xl:px-10 xl:pt-8">
                <div className="min-w-0">
                  <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
                    Register new product
                  </h1>
                  <p className="mt-1.5 max-w-[760px] text-[15px] leading-6 text-dash-muted">
                    Create a catalogue record for a product. Register each
                    product only once.
                  </p>

                  <Link
                    href="/dashboard/products"
                    className="mt-6 inline-flex items-center gap-2 rounded text-sm font-semibold text-brand-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    Back to product registry
                  </Link>

                  <RegisterProductForm />

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
