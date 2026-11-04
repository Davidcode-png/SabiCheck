"use client";

import { ChevronDown } from "lucide-react";

import { useOverviewStats } from "@/components/dashboard/overview-stats-provider";
import type { VerificationTrendPoint } from "@/lib/api/overview";
import { cn } from "@/lib/cn";

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const RANGE_DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  timeZone: "UTC",
});

const RANGE_DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const RANGE_DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const RANGE_DAY_LONG_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function parseDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

function dayLabel(iso: string) {
  return DAY_LABEL.format(parseDay(iso));
}

function formatRange(points: ReadonlyArray<VerificationTrendPoint>) {
  if (points.length === 0) return "";

  const first = parseDay(points[0].date);
  const last = parseDay(points[points.length - 1].date);
  const sameMonth =
    first.getUTCFullYear() === last.getUTCFullYear() &&
    first.getUTCMonth() === last.getUTCMonth();

  if (sameMonth) {
    return `${RANGE_DAY.format(first)}–${RANGE_DAY_LONG_MONTH_YEAR.format(last)}`;
  }

  return `${RANGE_DAY_MONTH.format(first)} – ${RANGE_DAY_MONTH_YEAR.format(last)}`;
}

/** Round the y-axis top up to a readable step with integer ticks. */
function niceAxisMax(value: number) {
  if (value <= 0) return 2;
  if (value <= 10) return Math.max(2, Math.ceil(value / 2) * 2);

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
}

function formatAxis(value: number) {
  return value.toLocaleString("en-NG", { maximumFractionDigits: 1 });
}

function barHeight(value: number, axisMax: number) {
  if (value <= 0) return "0%";
  return `${Math.max((value / axisMax) * 100, 2)}%`;
}

function labelIndexes(count: number) {
  if (count <= 1) return [0];
  if (count <= 5) return Array.from({ length: count }, (_, index) => index);

  const indexes = [
    0,
    Math.floor(count / 4),
    Math.floor(count / 2),
    Math.floor((count * 3) / 4),
    count - 1,
  ];

  return Array.from(new Set(indexes));
}

function labelTransform(index: number, total: number) {
  if (index === 0) return "translateX(0)";
  if (index === total - 1) return "translateX(-100%)";
  return "translateX(-50%)";
}

export function TrendCard() {
  const { stats, status } = useOverviewStats();
  const points = stats?.verification_trend ?? [];
  const hasData = points.length > 0;
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const peak = points.reduce((max, point) => Math.max(max, point.count), 0);
  const axisMax = niceAxisMax(peak);
  const ticks = [axisMax, axisMax / 2, 0];
  const labels = labelIndexes(points.length);
  const range = formatRange(points);
  const totalLabel = hasData ? total.toLocaleString("en-NG") : "—";

  return (
    <section
      id="verification-trend"
      aria-labelledby="trend-heading"
      className="mt-6 scroll-mt-24 rounded-xl border border-dash-line bg-white px-5 py-5 xl:px-6 xl:pb-5 xl:pt-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="trend-heading"
            className="font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl"
          >
            Verification trend
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-dash-muted">
            Daily code checks
          </p>
        </div>

        <div className="relative shrink-0">
          <select
            aria-label="Trend interval"
            defaultValue="daily"
            className="h-9 appearance-none rounded-lg border border-dash-line bg-white pl-3 pr-8 text-sm font-medium text-brand-ink transition-colors hover:bg-dash-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <option value="daily">Daily</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink"
            strokeWidth={2}
          />
        </div>
      </div>

      <p className="mt-5 flex items-center gap-2 text-[13px] leading-[18px] text-dash-muted xl:mt-6">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-brand-ink"
        />
        All checks · {totalLabel} total
      </p>

      <figure className="mt-4">
        {hasData ? (
          <>
            <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-3">
              <div
                aria-hidden="true"
                className="flex h-[180px] flex-col justify-between text-right text-[11px] leading-4 text-dash-muted"
              >
                {ticks.map((tick) => (
                  <span key={tick}>{formatAxis(tick)}</span>
                ))}
              </div>

              <div className="relative h-[180px]">
                <div className="absolute inset-0 flex items-end gap-1.5 xl:gap-[18px]">
                  {points.map((point, index) => {
                    const last = index === points.length - 1;

                    return (
                      <div
                        key={point.date}
                        className="flex h-full flex-1 items-end"
                      >
                        <div
                          className={cn(
                            "w-full rounded-t-[3px]",
                            last ? "bg-dash-teal" : "bg-brand-ink",
                          )}
                          style={{ height: barHeight(point.count, axisMax) }}
                          title={`${dayLabel(point.date)}: ${point.count.toLocaleString("en-NG")} checks`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between"
                >
                  <span className="h-px w-full bg-dash-line" />
                  <span className="h-px w-full bg-dash-line" />
                  <span className="h-px w-full bg-dash-line" />
                </div>
              </div>
            </div>

            <div className="relative ml-[50px] mt-2.5 h-4">
              {labels.map((index) => {
                const point = points[index];

                return (
                  <span
                    key={point.date}
                    aria-hidden="true"
                    className="absolute top-0 whitespace-nowrap text-[11px] leading-4 text-dash-muted"
                    style={{
                      left: `${(index / (points.length - 1)) * 100}%`,
                      transform: labelTransform(index, points.length),
                    }}
                  >
                    {dayLabel(point.date)}
                  </span>
                );
              })}
            </div>

            <figcaption className="mt-4 text-xs leading-5 text-dash-muted xl:text-[13px]">
              {range} · Counts represent check activity, not unique products
              or consumers.
            </figcaption>

            <div className="sr-only">
              <table>
                <caption>Verification checks by day for {range}</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Checks</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.date}>
                      <th scope="row">{dayLabel(point.date)}</th>
                      <td>{point.count.toLocaleString("en-NG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-dash-line bg-dash-canvas/40 text-sm font-medium text-dash-muted">
            {status === "error"
              ? "We could not load check activity."
              : "Loading check activity…"}
          </div>
        )}
      </figure>
    </section>
  );
}
