"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/lib/api/client";
import {
  validateSignIn,
  type SignInErrors,
  type SignInValues,
} from "@/lib/validation";

const FIELD_IDS: Record<keyof SignInErrors, string> = {
  email: "signin-email",
  password: "signin-password",
};

type Status = "idle" | "submitting";

export function SignInForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const [values, setValues] = useState<SignInValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<SignInErrors>({});
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof SignInValues>(key: K, value: SignInValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
    setStatus("idle");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0] as
      | keyof SignInErrors
      | undefined;

    if (firstError) {
      document.getElementById(FIELD_IDS[firstError])?.focus();
      return;
    }

    setStatus("submitting");
    setFormError(null);

    try {
      await signIn({ email: values.email.trim(), password: values.password });
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "We could not sign you in. Please try again.",
      );
      setStatus("idle");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
      <TextField
        id="signin-email"
        label="Work Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="name@company.com"
        autoComplete="email"
        value={values.email}
        onChange={(event) => update("email", event.target.value)}
        error={errors.email}
      />

      <div>
        <PasswordField
          id="signin-password"
          label="Password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          error={errors.password}
          labelAction={
            <Link
              href="/forgot-password"
              className="hidden rounded-sm text-sm font-semibold text-brand underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 md:inline"
            >
              Forgot password?
            </Link>
          }
        />

        <div className="mt-2 flex justify-end md:hidden">
          <Link
            href="/forgot-password"
            className="rounded-sm text-sm font-semibold text-brand underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Checkbox
        id="signin-remember"
        label="Remember me for 30 days"
        checked={remember}
        onCheckedChange={setRemember}
      />

      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <Button type="submit" loading={status === "submitting"}>
        Sign In
      </Button>
    </form>
  );
}
