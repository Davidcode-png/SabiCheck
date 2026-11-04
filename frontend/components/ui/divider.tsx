import { cn } from "@/lib/cn";

export function Divider({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("h-px w-full bg-line", className)} />;
}
