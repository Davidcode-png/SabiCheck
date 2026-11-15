import { Check } from "lucide-react";

export function CheckItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-land-mint/80 text-land-green"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <div>
        <p className="text-[15px] font-semibold leading-6 text-land-ink">
          {title}
        </p>
        <p className="mt-0.5 text-[15px] leading-6 text-land-muted">
          {description}
        </p>
      </div>
    </li>
  );
}
