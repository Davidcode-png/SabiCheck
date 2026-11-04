import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { RequireSession } from "@/components/auth/require-session";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardBreadcrumbItem } from "@/components/dashboard/dashboard-topbar";
import { DashboardWorkspaceGate } from "@/components/dashboard/dashboard-workspace-gate";
import { MobileDashboardHeader } from "@/components/dashboard/mobile-dashboard-header";
import { OrganizationProvider } from "@/components/organizations/organization-provider";
import { ProductRegistry } from "@/components/products/product-registry";
import { RegistryGuide } from "@/components/products/registry-guide";

export const metadata: Metadata = {
  title: "Products",
};

const BREADCRUMB: ReadonlyArray<DashboardBreadcrumbItem> = [
  { label: "Workspace", href: "/dashboard" },
  { label: "Products & codes" },
];

export default function ProductsPage() {
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
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
                    <div className="min-w-0">
                      <h1 className="font-display text-[28px] font-bold leading-9 text-brand-ink sm:text-[30px] xl:text-[34px] xl:leading-[42px]">
                        Products
                      </h1>
                      <p className="mt-1.5 max-w-[640px] text-[15px] leading-6 text-dash-muted">
                        Manage your registered products, view batches and code
                        usage.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/products/register"
                      className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto xl:mt-1"
                    >
                      Register product
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>

                  <ProductRegistry />
                  <RegistryGuide />

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
