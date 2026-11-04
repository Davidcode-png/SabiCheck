"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/cn";

import {
  controlClassName,
  fieldLabelClassName,
} from "./text-field";

export const COUNTRY_CODES = [
  { code: "+234", short: "NG", name: "Nigeria" },
  { code: "+233", short: "GH", name: "Ghana" },
  { code: "+254", short: "KE", name: "Kenya" },
  { code: "+27", short: "ZA", name: "South Africa" },
  { code: "+44", short: "GB", name: "United Kingdom" },
  { code: "+1", short: "US", name: "United States" },
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number]["code"];

type PhoneFieldProps = {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  id?: string;
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  autoComplete?: string;
  /**
   * `split` shows a separate country select (default).
   * `inline` keeps the prefix and number in a single bordered control.
   */
  variant?: "split" | "inline";
};

export function PhoneField({
  country,
  onCountryChange,
  value,
  onChange,
  error,
  id,
  label = "Phone Number",
  labelClassName: labelOverride,
  placeholder = "812 345 6789",
  autoComplete = "tel-national",
  variant = "split",
}: PhoneFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const selected = COUNTRY_CODES.find((item) => item.code === country);

  if (variant === "inline") {
    return (
      <div className="w-full">
        <div className="mb-2 flex min-h-5 items-center">
          <label htmlFor={fieldId} className={cn(fieldLabelClassName, labelOverride)}>
            {label}
          </label>
        </div>

        <div
          className={cn(
            "flex h-[50px] w-full items-stretch overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(16_24_40_/_0.02)] transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10",
            error && "border-error focus-within:ring-error/10",
          )}
        >
          <select
            aria-label="Country code"
            value={country}
            onChange={(event) =>
              onCountryChange(event.target.value as CountryCode)
            }
            className="h-full shrink-0 cursor-pointer appearance-none bg-transparent pl-4 pr-2 text-base font-medium text-muted outline-none"
          >
            {COUNTRY_CODES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>

          <input
            id={fieldId}
            type="tel"
            inputMode="tel"
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? messageId : undefined}
            className="h-full min-w-0 flex-1 bg-transparent pl-2 pr-4 text-base text-ink outline-none placeholder:text-subtle"
          />
        </div>

        {error ? (
          <p id={messageId} role="alert" className="mt-1.5 text-[13px] leading-5 text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex min-h-5 items-center">
        <label htmlFor={fieldId} className={cn(fieldLabelClassName, labelOverride)}>
          {label}
        </label>
      </div>

      <div className="flex gap-3 max-[359px]:flex-col">
        <div className="relative w-[120px] shrink-0 max-[359px]:w-full md:w-[132px]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-[15px] w-[15px] -translate-y-1/2 items-center justify-center rounded-[3px] bg-brand-ink text-[7px] font-bold leading-none text-white"
          >
            {selected?.short}
          </span>

          <select
            aria-label="Country code"
            value={country}
            onChange={(event) =>
              onCountryChange(event.target.value as CountryCode)
            }
            className={cn(
              controlClassName,
              "cursor-pointer appearance-none pl-9 pr-7 text-sm font-semibold md:pl-10 md:pr-8",
            )}
          >
            {COUNTRY_CODES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>

          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted md:right-2.5"
          />
        </div>

        <input
          id={fieldId}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className={cn(controlClassName, "min-w-0 flex-1 px-3.5")}
        />
      </div>

      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-[13px] leading-5 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
