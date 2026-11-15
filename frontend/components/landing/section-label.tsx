import { cn } from "@/lib/cn";

export function SectionLabel({
  children,
  tone = "green",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "mint";
  size?: "sm" | "xs";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-semibold uppercase leading-5",
        size === "xs"
          ? "text-[10px] tracking-[0.08em]"
          : "text-[11px] tracking-[0.12em]",
        tone === "mint" ? "text-land-mint" : "text-land-green",
        className,
      )}
    >
      {children}
    </p>
  );
}
