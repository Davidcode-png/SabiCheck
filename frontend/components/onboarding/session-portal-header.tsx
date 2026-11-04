"use client";

import { useSession } from "@/components/auth/session-provider";
import { PortalHeader } from "@/components/onboarding/portal-header";
import { userDisplayName, userInitials } from "@/lib/user";

export function SessionPortalHeader() {
  const { user } = useSession();

  // RequireSession shows the loading state until the user is available.
  if (!user) return null;

  return (
    <PortalHeader
      user={{
        name: userDisplayName(user),
        email: user.email,
        initials: userInitials(user),
      }}
    />
  );
}
