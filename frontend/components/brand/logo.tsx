import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

type LogoProps = {
  /** Pass `null` to render a static mark instead of a link. */
  href?: string | null;
  showWordmark?: boolean;
  priority?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  /** Optional line under the wordmark, e.g. "Business Portal". */
  tagline?: string;
};

export function Logo({
  href = "/",
  showWordmark = true,
  priority = false,
  className,
  markClassName,
  wordmarkClassName,
  tagline,
}: LogoProps) {
  const wordmark = (
    <span
      className={cn(
        "font-display text-[22px] font-extrabold leading-none text-brand-ink",
        wordmarkClassName,
      )}
    >
      Sabi<span className="text-brand">Check</span>
    </span>
  );

  const content = (
    <>
      <Image
        src="/brand/mark.svg"
        alt={showWordmark ? "" : "SabiCheck"}
        width={40}
        height={40}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className={cn(
          "h-9 w-9 shrink-0 md:h-10 md:w-10",
          markClassName,
        )}
      />
      {showWordmark ? (
        tagline ? (
          <span className="flex flex-col items-start gap-1">
            {wordmark}
            <span className="text-[9px] font-bold uppercase leading-none tracking-[0.16em] text-muted">
              {tagline}
            </span>
          </span>
        ) : (
          wordmark
        )
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="SabiCheck home"
      className={cn(classes, "rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15")}
    >
      {content}
    </Link>
  );
}
