import { apiFetch } from "@/lib/api/client";

export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantAnswer = {
  answer: string;
  model: string;
  scope: "workspace";
  generated_at: string;
  organization_id: string;
};

export const assistantApi = {
  ask(
    organizationId: string,
    message: string,
    history: AssistantTurn[],
  ): Promise<AssistantAnswer> {
    return apiFetch<AssistantAnswer>(
      `/organizations/${organizationId}/assistant`,
      {
        method: "POST",
        body: { message, history },
      },
    );
  },
};
