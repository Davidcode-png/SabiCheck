"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSession } from "@/components/auth/session-provider";

/**
 * Renders children only for an authenticated session. The proxy handles the
 * fast redirect; this also covers sessions that expire while the page is open.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <p
        role="status"
        className="flex items-center gap-3 text-sm font-medium text-muted"
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand motion-reduce:animate-none"
        />
        Loading your workspace…
      </p>
    </div>
  );
}
