import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

const variants = {
  primary:
    "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/25",
  secondary:
    "border border-line bg-white text-ink hover:bg-canvas focus-visible:ring-brand/15",
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  fullWidth = true,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-60",
        size === "lg" ? "h-[52px]" : "h-12",
        fullWidth && "w-full",
        variants[variant],
        className,
      )}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="h-[18px] w-[18px] animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
