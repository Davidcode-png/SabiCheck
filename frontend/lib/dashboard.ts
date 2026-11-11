export const REPORTING_PERIOD = {
  period: "01–16 Oct 2026",
  periodLong: "01–16 October 2026",
} as const;

export type DashboardNavIcon =
  | "overview"
  | "products"
  | "distribution"
  | "verifications"
  | "reports"
  | "alerts"
  | "settings";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: DashboardNavIcon;
};

export const NAV_ITEMS: ReadonlyArray<DashboardNavItem> = [
  { label: "Overview", href: "/dashboard", icon: "overview" },
  { label: "Products & codes", href: "/dashboard/products", icon: "products" },
  { label: "Distribution", href: "/dashboard/distribution", icon: "distribution" },
  {
    label: "Verifications",
    href: "/dashboard/verifications",
    icon: "verifications",
  },
  { label: "Consumer reports", href: "/dashboard/reports", icon: "reports" },
  { label: "Alerts", href: "/dashboard/alerts", icon: "alerts" },
];

export const SETTINGS_NAV_ITEM: DashboardNavItem = {
  label: "Company settings",
  href: "/dashboard/settings",
  icon: "settings",
};

export type StatIcon =
  | "products"
  | "batches"
  | "purchased"
  | "applied"
  | "matched"
  | "repeat"
  | "reports";

export type OverviewStatKey =
  | "total_products"
  | "active_batches"
  | "codes_purchased"
  | "codes_applied"
  | "matched_records"
  | "repeat_code_alerts"
  | "consumer_reports";

export type DashboardStatDefinition = {
  key: OverviewStatKey;
  label: string;
  description: string;
  icon: StatIcon;
};

export const DASHBOARD_STAT_DEFINITIONS: ReadonlyArray<DashboardStatDefinition> =
  [
    {
      key: "total_products",
      label: "Total products",
      description: "Products in this organization",
      icon: "products",
    },
    {
      key: "active_batches",
      label: "Active batches",
      description: "Active batches in this organization",
      icon: "batches",
    },
    {
      key: "codes_purchased",
      label: "Codes purchased",
      description: "All codes bought or generated",
      icon: "purchased",
    },
    {
      key: "codes_applied",
      label: "Codes applied",
      description: "Codes marked as used",
      icon: "applied",
    },
    {
      key: "matched_records",
      label: "Matched records",
      description: "Codes verified successfully",
      icon: "matched",
    },
    {
      key: "repeat_code_alerts",
      label: "Repeat-code alerts",
      description: "Codes checked more than once",
      icon: "repeat",
    },
    {
      key: "consumer_reports",
      label: "Consumer reports",
      description: "Codes reported by consumers",
      icon: "reports",
    },
  ];

/** Compact card value, for example 1.2M, 620k or 1,204. */
export function formatOverviewCount(value: number | null | undefined) {
  if (value == null) return "—";

  if (value >= 1_000_000) {
    const millions = (value / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${millions}M`;
  }

  if (value >= 10_000) {
    return `${Math.round(value / 1_000)}k`;
  }

  return value.toLocaleString("en-NG");
}

export type ReportingItem = {
  id: string;
  name: string;
  detail: string;
  reports: number;
};

const CSV_FILENAME = "sabicheck-overview-01-16-oct-2026.csv";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Builds the demo overview export. Replace with a server-generated report once
 * the dashboard API exists.
 */
export function buildOverviewCsv(
  workspaceName = "Workspace",
  values: Partial<Record<OverviewStatKey, number>> = {},
) {
  const rows: Array<Array<string | number>> = [
    ["SabiCheck overview"],
    ["Workspace", workspaceName],
    ["Period", REPORTING_PERIOD.period],
    [],
    ["Metric", "Value", "Description"],
    ...DASHBOARD_STAT_DEFINITIONS.map((stat) => [
      stat.label,
      values[stat.key] ?? "Not tracked",
      stat.description,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export const OVERVIEW_CSV_FILENAME = CSV_FILENAME;
