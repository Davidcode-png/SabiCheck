import { Check, Info } from "lucide-react";

import {
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { cn } from "@/lib/cn";

type CompletedSteps = Record<OnboardingStepId, boolean>;

type VerificationStepsProps = {
  activeStep: OnboardingStepId;
  completed: CompletedSteps;
  onSelect: (step: OnboardingStepId) => void;
};

function stepStatus(
  step: OnboardingStepId,
  activeStep: OnboardingStepId,
  completed: CompletedSteps,
) {
  if (step === activeStep) return "Currently Editing";
  if (completed[step]) return "Completed";
  return "Not started";
}

function StepCircle({
  active,
  complete,
  number,
  compact = false,
}: {
  active: boolean;
  complete: boolean;
  number: number;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-bold",
        compact ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs",
        active
          ? "border-brand bg-brand text-white"
          : complete
            ? "border-brand/20 bg-brand-soft text-brand"
            : "border-line bg-white text-muted",
      )}
    >
      {complete && !active ? (
        <Check
          className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          strokeWidth={3}
        />
      ) : (
        number
      )}
    </span>
  );
}

function InfoNote({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2.5 rounded-xl bg-brand-tint p-4", className)}>
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white"
      >
        <Info className="h-3 w-3" strokeWidth={2.5} />
      </span>
      <p className="text-xs font-medium leading-5 text-brand-ink">
        Your information is encrypted and only used for KYC/Regulatory
        verification purposes.
      </p>
    </div>
  );
}

export function VerificationSteps({
  activeStep,
  completed,
  onSelect,
}: VerificationStepsProps) {
  const activeNumber =
    ONBOARDING_STEPS.findIndex((step) => step.id === activeStep) + 1;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Verification steps"
        className="hidden rounded-2xl border border-line bg-white p-6 shadow-card lg:block"
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Verification Steps
        </h2>

        <ol className="mt-6">
          {ONBOARDING_STEPS.map((step, index) => {
            const active = step.id === activeStep;
            const complete = completed[step.id];
            const status = stepStatus(step.id, activeStep, completed);

            return (
              <li key={step.id} className="relative pb-8 last:pb-0">
                {index < ONBOARDING_STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-4 top-9 h-[calc(100%-1.75rem)] w-px bg-line"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  aria-current={active ? "step" : undefined}
                  className="relative flex w-full items-start gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
                >
                  <StepCircle
                    active={active}
                    complete={complete}
                    number={step.number}
                  />
                  <span className="min-w-0 pt-0.5">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        active || complete ? "text-brand-ink" : "text-muted",
                      )}
                    >
                      {step.label}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        active ? "font-medium text-brand" : "text-muted",
                      )}
                    >
                      {status}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <InfoNote className="mt-6" />
      </aside>

      {/* Mobile / tablet stepper */}
      <aside
        aria-label="Verification steps"
        className="rounded-2xl border border-line bg-white p-4 shadow-card lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Verification Steps
          </h2>
          <p className="text-xs font-semibold text-muted">
            Step {activeNumber} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        <ol className="mt-4 grid grid-cols-3 gap-1">
          {ONBOARDING_STEPS.map((step) => {
            const active = step.id === activeStep;
            const complete = completed[step.id];
            const status = stepStatus(step.id, activeStep, completed);

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                    active ? "bg-brand-soft/70" : "hover:bg-canvas",
                  )}
                >
                  <StepCircle
                    active={active}
                    complete={complete}
                    number={step.number}
                    compact
                  />
                  <span
                    className={cn(
                      "text-[11px] font-semibold leading-4",
                      active || complete ? "text-brand-ink" : "text-muted",
                    )}
                  >
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                  <span className="sr-only">{status}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <InfoNote className="mt-3 p-3" />
      </aside>
    </>
  );
}
