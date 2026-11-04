import type { LucideIcon } from "lucide-react";
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export const fieldLabelClassName =
  "text-sm font-semibold leading-5 text-label";

export const compactLabelClassName =
  "max-md:uppercase max-md:text-[11px] max-md:leading-4";

export const controlClassName =
  "h-[50px] w-full rounded-xl border border-line bg-white px-4 text-base text-ink shadow-[0_1px_2px_rgb(16_24_40_/_0.02)] outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/10";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "size"
> & {
  label: ReactNode;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  endAdornment?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export function TextField({
  label,
  icon: Icon,
  error,
  hint,
  labelAction,
  endAdornment,
  containerClassName,
  inputClassName,
  labelClassName: labelOverride,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("w-full", containerClassName)}>
      <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={fieldId} className={cn(fieldLabelClassName, labelOverride)}>
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle"
          />
        ) : null}

        <input
          {...props}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            controlClassName,
            Icon && "pl-11",
            endAdornment && "pr-12",
            inputClassName,
          )}
        />

        {endAdornment ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-[13px] leading-5 text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-[13px] leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
