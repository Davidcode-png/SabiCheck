import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function LandingContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1248px] px-6 sm:px-8 lg:px-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
