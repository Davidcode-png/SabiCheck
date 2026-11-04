"use client";

import { ArrowLeft, CircleHelp, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

const HELP_ITEMS = [
  "Scratch off the label on your pack to reveal the code.",
  "Enter the code exactly as it appears, including letters and numbers.",
  "A match means the code is in a manufacturer's records. It does not by itself prove the pack is genuine.",
  "If a code has been checked before, inspect the pack and report anything that looks wrong.",
] as const;

export function ConsumerShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!helpOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setHelpOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [helpOpen]);

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-canvas sm:border-x sm:border-line">
        <header className="sticky top-0 z-20 border-b border-line bg-white">
          <div className="flex h-[68px] items-center gap-2 px-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </button>

            <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-6 text-brand-ink">
              {title}
            </h1>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Help"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-brand-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <CircleHelp
                aria-hidden="true"
                className="h-[18px] w-[18px]"
                strokeWidth={1.8}
              />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-5 pb-8 pt-6">{children}</main>
      </div>

      {helpOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/40 sm:items-center sm:p-6"
          role="presentation"
          onClick={() => setHelpOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="consumer-help-title"
            className="w-full max-w-[420px] rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="consumer-help-title"
                  className="font-display text-xl font-bold text-brand-ink"
                >
                  How checking works
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  A quick guide to verifying a product code.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close help"
                autoFocus
                className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink">
              {HELP_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button className="mt-6" onClick={() => setHelpOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
