import type { ReactNode } from "react";

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <header>
      <h1 className="font-display text-[26px] font-bold leading-[1.2] text-brand-ink md:text-[28px]">
        {title}
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-muted md:text-base">
        {description}
      </p>
    </header>
  );
}
