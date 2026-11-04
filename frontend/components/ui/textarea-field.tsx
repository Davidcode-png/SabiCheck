import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { fieldLabelClassName } from "./text-field";

type TextareaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  label: ReactNode;
  error?: string;
  hint?: string;
  containerClassName?: string;
  textareaClassName?: string;
};

export function TextareaField({
  label,
  error,
  hint,
  containerClassName,
  textareaClassName,
  id,
  ...props
}: TextareaFieldProps) {
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

      <textarea
        {...props}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          "block min-h-[74px] w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-base leading-6 text-ink shadow-[0_1px_2px_rgb(16_24_40_/_0.02)] outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/10",
          textareaClassName,
        )}
      />

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
