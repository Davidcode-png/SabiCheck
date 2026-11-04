import Link from "next/link";

import { cn } from "@/lib/cn";

type AuthSwitchProps = {
  prompt: string;
  action: string;
  href: string;
  className?: string;
};

export function AuthSwitch({
  prompt,
  action,
  href,
  className,
}: AuthSwitchProps) {
  return (
    <p className={cn("text-center text-sm text-muted", className)}>
      {prompt}{" "}
      <Link
        href={href}
        className="rounded-sm font-semibold text-brand underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
      >
        {action}
      </Link>
    </p>
  );
}
