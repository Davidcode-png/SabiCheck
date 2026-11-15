import { apiFetch } from "@/lib/api/client";

export type WaitlistRole = "consumer" | "manufacturer" | "partner" | "other";

export const WAITLIST_ROLES: ReadonlyArray<{
  value: WaitlistRole;
  label: string;
}> = [
  { value: "consumer", label: "Consumer" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

export type WaitlistSignup = {
  name: string;
  email: string;
  role: WaitlistRole;
};

export const waitlistApi = {
  join: (payload: WaitlistSignup) =>
    apiFetch<{ message: string }>("/public/waitlist", {
      method: "POST",
      body: payload,
      auth: false,
    }),
};
