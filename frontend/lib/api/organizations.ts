import { apiFetch } from "@/lib/api/client";

export type RegistrationType =
  | "LLC"
  | "PLC"
  | "Partnership"
  | "Sole Proprietorship"
  | "NGO"
  | "Unknown";

export type IndustryType =
  | "Electronics"
  | "Computers"
  | "Games"
  | "Home Goods"
  | "Toys"
  | "Clothing"
  | "Beauty"
  | "Food"
  | "Health"
  | "Household"
  | "Sports"
  | "Other";

export type OrganizationRole = "Owner" | "Admin" | "Member";

export type OrganizationMember = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: OrganizationRole;
  joined_at: string;
};

export type FileAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  public_id: string;
  resource_type: string;
  file_format: string | null;
  content_type: string | null;
  file_size: number | null;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  registration_type: RegistrationType;
  registration_code: string;
  industry_type: IndustryType;
  website: string | null;
  state: string;
  country: string;
  address: string;
  contact_person_full_name: string;
  business_email: string;
  phone_no: string;
  registration_details: string | null;
  reference_number: string;
  manufacturer_prefix: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
  attachments: FileAttachment[];
};

export type OrganizationCreatePayload = {
  name: string;
  registration_type: RegistrationType;
  registration_code: string;
  industry_type: IndustryType;
  website?: string | null;
  state: string;
  country?: string;
  address: string;
  contact_person_full_name: string;
  business_email: string;
  phone_no: string;
  registration_details?: string | null;
  reference_number?: string | null;
  manufacturer_prefix?: string;
};

export type OrganizationUpdatePayload = Partial<
  Omit<OrganizationCreatePayload, "reference_number">
>;

export const organizationApi = {
  list: () => apiFetch<Organization[]>("/organizations"),

  get: (organizationId: string) =>
    apiFetch<Organization>(`/organizations/${organizationId}`),

  listMembers: (organizationId: string) =>
    apiFetch<OrganizationMember[]>(
      `/organizations/${organizationId}/members`,
    ),

  create: (payload: OrganizationCreatePayload) =>
    apiFetch<Organization>("/organizations", {
      method: "POST",
      body: payload,
    }),

  update: (organizationId: string, payload: OrganizationUpdatePayload) =>
    apiFetch<Organization>(`/organizations/${organizationId}`, {
      method: "PATCH",
      body: payload,
    }),

  uploadDocuments: (
    organizationId: string,
    files: File | ReadonlyArray<File>,
  ) => {
    const formData = new FormData();

    for (const file of Array.isArray(files) ? files : [files]) {
      formData.append("files", file);
    }

    return apiFetch<FileAttachment[]>(
      `/organizations/${organizationId}/documents`,
      {
        method: "POST",
        body: formData,
      },
    );
  },
};
