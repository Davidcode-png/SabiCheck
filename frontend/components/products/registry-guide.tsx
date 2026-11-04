import { cn } from "@/lib/cn";

const GUIDE_STEPS = [
  {
    title: "Register product",
    body: "Create the catalogue record once. No batch or unit codes are created.",
  },
  {
    title: "Register batch",
    body: "Add a production run and its expected release quantity to a product.",
  },
  {
    title: "Request unit codes",
    body: "Request unique, unpredictable codes for individual physical units in an existing batch.",
  },
] as const;

export function RegistryGuide() {
  return (
    <section
      aria-labelledby="registry-guide-title"
      className="mt-6 rounded-2xl border border-dash-line bg-white p-5 sm:p-6"
    >
      <h2
        id="registry-guide-title"
        className="font-display text-lg font-bold leading-6 text-brand-ink xl:text-xl xl:leading-7"
      >
        From catalogue to individual units
      </h2>

      <div className="mt-5 grid gap-5 xl:grid-cols-3 xl:gap-6">
        {GUIDE_STEPS.map((step, index) => (
          <div
            key={step.title}
            className={cn(
              "flex gap-3.5",
              index > 0 &&
                "border-t border-dash-line pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0",
            )}
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dash-tint text-xs font-bold text-brand-ink"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-5 text-brand-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-dash-muted">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
