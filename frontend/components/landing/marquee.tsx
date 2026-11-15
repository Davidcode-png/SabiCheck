import { Check } from "lucide-react";

const ITEMS = [
  "Unique product codes",
  "Web & USSD verification",
  "Consumer-powered reporting",
] as const;

export function Marquee() {
  return (
    <div className="overflow-hidden bg-land-green py-6">
      <div className="landing-marquee flex w-max">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="flex shrink-0 items-center"
          >
            {ITEMS.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex items-center gap-2 pr-12 text-[13px] font-medium text-white"
              >
                <Check
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                  strokeWidth={2.5}
                />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
