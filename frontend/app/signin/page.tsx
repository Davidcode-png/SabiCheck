import type { Metadata } from "next";

import { AuthHeading } from "@/components/auth/auth-heading";
import { SignInFooter } from "@/components/auth/auth-footer";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSwitch } from "@/components/auth/auth-switch";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Divider } from "@/components/ui/divider";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <AuthShell footer={<SignInFooter />}>
      <AuthHeading
        title="Welcome back"
        description={
          <>
            Enter your credentials to access your{" "}
            <span className="md:hidden">secure workspace.</span>
            <span className="hidden md:inline">account.</span>
          </>
        }
      />

      <SignInForm />

      <Divider className="my-7 hidden md:block" />

      <AuthSwitch
        prompt="Don't have an account?"
        action="Create an account"
        href="/signup"
        className="mt-7 md:mt-0"
      />
    </AuthShell>
  );
}
