import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

type AuthShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  width?: "signin" | "signup";
  /** Sign-up keeps its card on small screens; sign-in goes edge to edge. */
  mobileCard?: boolean;
  className?: string;
};

export function AuthShell({
  children,
  footer,
  width = "signin",
  mobileCard = false,
  className,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div
        className={cn(
          "flex w-full flex-1 flex-col items-center px-6 pb-6 pt-12 md:px-8 md:pb-14 md:pt-16",
          className,
        )}
      >
        {/* Auto margins centre the stack when there is room but keep the top
            edge reachable when a short viewport forces it to scroll. */}
        <div className="flex w-full flex-1 flex-col items-center md:my-auto md:flex-none">
          <Logo priority />

          <main
            className={cn(
              "mt-8 w-full md:mt-10 md:rounded-2xl md:border md:border-line md:bg-white md:p-10 md:shadow-card",
              width === "signin" ? "max-w-[480px]" : "max-w-[536px]",
              mobileCard &&
                "rounded-3xl border border-line bg-white px-6 py-8 shadow-card",
            )}
          >
            {children}
          </main>

          {footer ? (
            <div className="mt-auto flex w-full justify-center pt-10 md:mt-0 md:pt-12">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
