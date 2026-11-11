import { apiFetch } from "@/lib/api/client";

export type AlertEventType = "repeat_code" | "consumer_report";
export type AlertStatus = "needs-review" | "in-review" | "reviewed";

export type AlertDistributor = {
  id: string;
  name: string;
  tracking_code: string;
  city: string | null;
  state: string | null;
};

export type Alert = {
  id: string;
  event_type: AlertEventType;
  source_id: string;
  reference: string | null;
  product_id: string | null;
  product_name: string | null;
  pack_size: string | null;
  code: string;
  note: string;
  distributor: AlertDistributor | null;
  recorded_at: string;
  status: AlertStatus;
};

export type AlertList = {
  items: Alert[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type AlertEventFilter = "all" | AlertEventType;
export type AlertStatusFilter = "all" | AlertStatus;

export type AlertListParams = {
  search?: string;
  eventType?: AlertEventFilter;
  status?: AlertStatusFilter;
  page?: number;
  pageSize?: number;
};

export const ALERT_EVENT_LABELS: Record<AlertEventType, string> = {
  repeat_code: "Repeat-code alert",
  consumer_report: "Consumer report",
};

export const ALERT_EVENT_OPTIONS: ReadonlyArray<{
  value: AlertEventType;
  label: string;
}> = [
  { value: "repeat_code", label: ALERT_EVENT_LABELS.repeat_code },
  { value: "consumer_report", label: ALERT_EVENT_LABELS.consumer_report },
];

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  "needs-review": "Needs review",
  "in-review": "In review",
  reviewed: "Reviewed",
};

export const ALERT_STATUS_OPTIONS: ReadonlyArray<{
  value: AlertStatus;
  label: string;
}> = [
  { value: "needs-review", label: ALERT_STATUS_LABELS["needs-review"] },
  { value: "in-review", label: ALERT_STATUS_LABELS["in-review"] },
  { value: "reviewed", label: ALERT_STATUS_LABELS.reviewed },
];

/** Human-readable WAT timestamp, for example ``16 Oct 2026 · 14:42 WAT``. */
export function formatAlertRecorded(value: string) {
  const date = new Date(value);

  const day = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(date);

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  }).format(date);

  return `${day} · ${time} WAT`;
}

function buildQuery(params: AlertListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.eventType && params.eventType !== "all") {
    query.set("event_type", params.eventType);
  }
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  if (params.pageSize) {
    query.set("page_size", String(params.pageSize));
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

export const alertApi = {
  list: (organizationId: string, params: AlertListParams = {}) =>
    apiFetch<AlertList>(
      `/organizations/${organizationId}/alerts${buildQuery(params)}`,
    ),
};
