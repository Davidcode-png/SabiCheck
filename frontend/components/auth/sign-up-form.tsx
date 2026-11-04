"use client";

import { ArrowRight, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import {
  PhoneField,
  type CountryCode,
} from "@/components/ui/phone-field";
import { TextField, compactLabelClassName } from "@/components/ui/text-field";
import { ApiError } from "@/lib/api/client";
import {
  validateSignUp,
  type SignUpErrors,
  type SignUpValues,
} from "@/lib/validation";

const FIELD_IDS: Record<keyof SignUpErrors, string> = {
  fullName: "signup-name",
  email: "signup-email",
  phone: "signup-phone",
  password: "signup-password",
  confirmPassword: "signup-confirm",
  terms: "signup-terms",
};

type Status = "idle" | "submitting";

function splitFullName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { first_name: firstName, last_name: rest.join(" ") };
}

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useSession();
  const [values, setValues] = useState<SignUpValues>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [country, setCountry] = useState<CountryCode>("+234");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof SignUpValues>(
    key: K,
    value: SignUpValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
    setStatus("idle");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = {
      ...validateSignUp(values),
      ...(acceptedTerms
        ? {}
        : { terms: "Please accept the Terms and Privacy Policy to continue." }),
    };
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0] as
      | keyof SignUpErrors
      | undefined;

    if (firstError) {
      document.getElementById(FIELD_IDS[firstError])?.focus();
      return;
    }

    setStatus("submitting");
    setFormError(null);

    const { first_name, last_name } = splitFullName(values.fullName);

    try {
      // The phone number is collected for onboarding; the user record only
      // stores the name, email, and password.
      await signUp({
        email: values.email.trim(),
        first_name,
        last_name,
        password: values.password,
      });
      router.replace("/onboarding");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors((current) => ({ ...current, email: error.message }));
        document.getElementById(FIELD_IDS.email)?.focus();
      } else {
        setFormError(
          error instanceof ApiError
            ? error.message
            : "We could not create your account. Please try again.",
        );
      }
      setStatus("idle");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
      <TextField
        id="signup-name"
        label="Full Name"
        name="name"
        icon={UserRound}
        placeholder="John Doe"
        autoComplete="name"
        value={values.fullName}
        onChange={(event) => update("fullName", event.target.value)}
        error={errors.fullName}
        labelClassName={compactLabelClassName}
      />

      <TextField
        id="signup-email"
        label="Work Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="name@company.com"
        autoComplete="email"
        value={values.email}
        onChange={(event) => update("email", event.target.value)}
        error={errors.email}
        labelClassName={compactLabelClassName}
      />

      <PhoneField
        id="signup-phone"
        country={country}
        onCountryChange={setCountry}
        value={values.phone}
        onChange={(event) => update("phone", event.target.value)}
        error={errors.phone}
        labelClassName={compactLabelClassName}
      />

      <div className="grid gap-5 md:grid-cols-2 md:gap-4">
        <PasswordField
          id="signup-password"
          label="Password"
          name="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          error={errors.password}
          labelClassName={compactLabelClassName}
        />

        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => update("confirmPassword", event.target.value)}
          error={errors.confirmPassword}
          labelClassName={compactLabelClassName}
        />
      </div>

      <Checkbox
        id="signup-terms"
        checked={acceptedTerms}
        onCheckedChange={(checked) => {
          setAcceptedTerms(checked);
          setErrors((current) => ({ ...current, terms: undefined }));
          setFormError(null);
          setStatus("idle");
        }}
        error={errors.terms}
        label={
          <>
            I agree to the{" "}
            <Link
              href="#"
              className="rounded-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="rounded-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              Privacy Policy
            </Link>
            , including the use of cookies.
          </>
        }
      />

      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <Button type="submit" loading={status === "submitting"}>
        Create Account
        {status === "submitting" ? null : (
          <ArrowRight aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
      </Button>
    </form>
  );
}
