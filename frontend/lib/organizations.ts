import type {
  Organization,
  OrganizationRole,
} from "@/lib/api/organizations";

/** Two-letter mark for a workspace avatar, e.g. "Abeni Foods Ltd" → "AF". */
export function organizationInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "SC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}

export function organizationTypeLabel(
  organization: Pick<Organization, "industry_type">,
) {
  return `${organization.industry_type} workspace`;
}

export function organizationRoleLabel(role: OrganizationRole) {
  switch (role) {
    case "Owner":
      return "Workspace owner";
    case "Admin":
      return "Workspace admin";
    case "Member":
      return "Workspace member";
  }
}
