import type { SessionUser } from "@/lib/api/types";

type NamedUser = Pick<SessionUser, "first_name" | "last_name">;

export function userDisplayName(user: NamedUser) {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function userInitials(user: NamedUser) {
  const letters =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  return letters || "SC";
}
