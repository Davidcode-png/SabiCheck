"use client";

import {
  CalendarDays,
  CalendarX,
  Check,
  Ellipsis,
  Eye,
  HeartPulse,
  PackageX,
  SearchX,
  Send,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ConcernValue } from "@/lib/api/public-code";
import { cn } from "@/lib/cn";
import { CONCERN_OPTIONS } from "@/lib/consumer-check";

const CONCERN_ICONS: Record<ConcernValue, LucideIcon> = {
  "Suspected counterfeit": ShieldAlert,
  "Unmatched code": SearchX,
  "Damaged packaging": PackageX,
  "Code has already been used": CalendarX,
  "Unusual appearance or smell": Eye,
  Illness: HeartPulse,
  Expired: CalendarDays,
  "Other concern": Ellipsis,
};

export function ReportConcernScreen({
  concern,
  onConcernChange,
  onContinue,
}: {
  concern: ConcernValue | null;
  onConcernChange: (value: ConcernValue) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.14em] text-brand">
          Concern
        </p>
        <p className="text-xs leading-5 text-muted">Step 1 of 2</p>
      </div>

      <h1 className="mt-3 font-display text-[30px] font-bold leading-[38px] text-brand-ink">
        What&apos;s your concern?
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-muted">
        Choose the option that best describes what you noticed.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">What&apos;s your concern?</legend>

        <div className="space-y-3">
          {CONCERN_OPTIONS.map((option) => {
            const Icon = CONCERN_ICONS[option.value];
            const selected = concern === option.value;

            return (
              <label key={option.value} className="block cursor-pointer">
                <input
                  type="radio"
                  name="concern"
                  value={option.value}
                  checked={selected}
                  onChange={() => onConcernChange(option.value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-brand/15",
                    selected
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-white hover:border-line-strong",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "h-5 w-5 shrink-0",
                      selected ? "text-brand" : "text-muted",
                    )}
                    strokeWidth={1.7}
                  />
                  <span className="flex-1 text-sm font-semibold leading-5 text-ink">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-white",
                    )}
                  >
                    {selected ? (
                      <Check
                        aria-hidden="true"
                        className="h-3 w-3"
                        strokeWidth={3}
                      />
                    ) : null}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button className="mt-6" onClick={onContinue} disabled={!concern}>
        <Send aria-hidden="true" className="h-[18px] w-[18px]" />
        Continue
      </Button>
    </div>
  );
}
