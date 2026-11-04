"use client";

import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type CheckboxProps = {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  id?: string;
  className?: string;
};

export function Checkbox({
  label,
  checked,
  onCheckedChange,
  error,
  id,
  className,
}: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input
            id={fieldId}
            type="checkbox"
            checked={checked}
            onChange={(event) => onCheckedChange(event.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? messageId : undefined}
            className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-[#98a2b3] bg-white transition-colors checked:border-brand checked:bg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 aria-[invalid=true]:border-error"
          />
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>

        <label
          htmlFor={fieldId}
          className="cursor-pointer select-none text-sm leading-5 text-label"
        >
          {label}
        </label>
      </div>

      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 pl-[30px] text-[13px] leading-5 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
