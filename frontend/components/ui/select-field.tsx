import { ChevronDown } from "lucide-react";
import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { controlClassName, fieldLabelClassName } from "./text-field";

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> & {
  label: ReactNode;
  options: ReadonlyArray<SelectOption>;
  placeholder?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  selectClassName?: string;
};

export function SelectField({
  label,
  options,
  placeholder,
  error,
  hint,
  containerClassName,
  selectClassName,
  id,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("w-full", containerClassName)}>
      <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={fieldId} className={fieldLabelClassName}>
          {label}
        </label>
      </div>

      <div className="relative">
        <select
          {...props}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            controlClassName,
            "cursor-pointer appearance-none pr-10",
            selectClassName,
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
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
