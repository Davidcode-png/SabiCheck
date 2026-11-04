import type { Metadata } from "next";

import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSwitch } from "@/components/auth/auth-switch";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Divider } from "@/components/ui/divider";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <AuthHeading
        title="Reset your password"
        description="Enter the email linked to your account and we'll send you a reset link."
      />

      <ForgotPasswordForm />

      <Divider className="my-7" />

      <AuthSwitch
        prompt="Remembered your password?"
        action="Back to sign in"
        href="/signin"
      />
    </AuthShell>
  );
}
