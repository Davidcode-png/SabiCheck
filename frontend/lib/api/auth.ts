import { apiFetch } from "@/lib/api/client";
import type {
  SessionUser,
  SignInPayload,
  SignUpPayload,
  TokenPair,
} from "@/lib/api/types";

export const authApi = {
  register: (payload: SignUpPayload) =>
    apiFetch<TokenPair>("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  login: (payload: SignInPayload) =>
    apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  me: () => apiFetch<SessionUser>("/auth/me"),
};
