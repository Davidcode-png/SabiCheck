"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormNotice } from "@/components/ui/form-notice";
import { TextField } from "@/components/ui/text-field";
import { EMAIL_PATTERN } from "@/lib/validation";

type Status = "idle" | "submitting" | "success";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your work email.");
      document.getElementById("forgot-email")?.focus();
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      document.getElementById("forgot-email")?.focus();
      return;
    }

    setStatus("submitting");

    // TODO: replace with the real password-reset request.
    await new Promise((resolve) => setTimeout(resolve, 700));

    setStatus("success");
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
      <TextField
        id="forgot-email"
        label="Work Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="name@company.com"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(undefined);
          setStatus("idle");
        }}
        error={error}
      />

      <Button type="submit" loading={status === "submitting"}>
        Send reset link
      </Button>

      {status === "success" ? (
        <FormNotice>
          If an account exists for that email, a reset link is on its way.
        </FormNotice>
      ) : null}
    </form>
  );
}
