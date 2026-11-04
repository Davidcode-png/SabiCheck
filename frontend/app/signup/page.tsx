import type { Metadata } from "next";

import { AuthHeading } from "@/components/auth/auth-heading";
import { SignUpFooter } from "@/components/auth/auth-footer";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSwitch } from "@/components/auth/auth-switch";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Divider } from "@/components/ui/divider";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <AuthShell width="signup" mobileCard footer={<SignUpFooter />}>
      <AuthHeading
        title="Create your account"
        description="Start your 14-day free trial. No credit card required."
      />

      <SignUpForm />

      <Divider className="my-7" />

      <AuthSwitch
        prompt="Already have an account?"
        action="Sign in"
        href="/signin"
      />
    </AuthShell>
  );
}
