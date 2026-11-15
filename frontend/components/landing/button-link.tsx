import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  withArrow?: boolean;
  className?: string;
  onClick?: () => void;
};

const variants = {
  primary:
    "bg-land-green text-white hover:bg-[#003a1f] focus-visible:ring-land-green/25",
  secondary:
    "border border-[#d7e3db] bg-white text-land-green hover:bg-land-canvas focus-visible:ring-land-green/15",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  withArrow = false,
  className,
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4",
        variants[variant],
        className,
      )}
    >
      {children}
      {withArrow ? (
        <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      ) : null}
    </Link>
  );
}
