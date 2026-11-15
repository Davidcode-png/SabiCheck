"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api/client";
import {
  WAITLIST_ROLES,
  waitlistApi,
  type WaitlistRole,
} from "@/lib/api/waitlist";
import { cn } from "@/lib/cn";

const inputClasses =
  "mt-2 h-12 w-full rounded-lg border border-[#d7e3db] bg-white px-4 text-[15px] text-land-ink placeholder:text-[#8a9a90] focus:border-land-accent focus:outline-none focus:ring-4 focus:ring-land-green/10";

export function WaitlistForm() {
  const [role, setRole] = useState<WaitlistRole>("consumer");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitting(true);
    setError(null);

    try {
      await waitlistApi.join({
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        role,
      });
      form.reset();
      setRole("consumer");
      setJoined(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We could not add you to the list. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (joined) {
    return (
      <div
        role="status"
        className="rounded-2xl bg-white p-8 text-center shadow-[0_30px_70px_-55px_rgba(0,69,36,0.55)]"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-land-mint text-land-green">
          <Check aria-hidden="true" className="h-6 w-6" strokeWidth={3} />
        </span>
        <h3 className="mt-5 font-display text-[26px] font-bold text-land-green">
          You&rsquo;re on the list.
        </h3>
        <p className="mt-2 text-[15px] leading-6 text-land-muted">
          We&rsquo;ll email you about launch news and early-access updates.
        </p>
        <button
          type="button"
          onClick={() => setJoined(false)}
          className="mt-5 text-sm font-semibold text-land-green underline underline-offset-4"
        >
          Add another email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_30px_70px_-55px_rgba(0,69,36,0.55)] sm:p-8">
      <h3 className="font-display text-[21px] font-bold text-land-green sm:text-[26px]">
        Your place starts here.
      </h3>

      <form onSubmit={handleSubmit} className="mt-6">
        <label
          htmlFor="waitlist-name"
          className="text-[13px] font-semibold text-land-ink"
        >
          Name
        </label>
        <input
          id="waitlist-name"
          name="name"
          type="text"
          required
          maxLength={255}
          autoComplete="name"
          placeholder="Your full name"
          className={inputClasses}
        />

        <label
          htmlFor="waitlist-email"
          className="mt-5 block text-[13px] font-semibold text-land-ink"
        >
          Email
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClasses}
        />

        <fieldset className="mt-5">
          <legend className="text-[13px] font-semibold text-land-ink">
            I&rsquo;m joining as a&hellip;
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {WAITLIST_ROLES.map((option) => {
              const checked = role === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-within:ring-4 focus-within:ring-land-green/15",
                    checked
                      ? "border-land-accent bg-land-canvas text-land-ink"
                      : "border-[#d7e3db] bg-white text-land-ink hover:bg-land-canvas/60",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={checked}
                    onChange={() => setRole(option.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      checked ? "border-land-accent" : "border-[#b9cdc0]",
                    )}
                  >
                    {checked ? (
                      <span className="h-2 w-2 rounded-full bg-land-green" />
                    ) : null}
                  </span>
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-error-soft px-4 py-3 text-sm text-error"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-land-green text-[15px] font-semibold text-white transition-colors hover:bg-[#003a1f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-land-green/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
              strokeWidth={2.5}
            />
          ) : null}
          {submitting ? "Joining\u2026" : "Join the Waitlist"}
          {submitting ? null : <span aria-hidden="true">&rarr;</span>}
        </button>

        <p className="mt-4 text-[12px] leading-5 text-land-muted">
          We&rsquo;ll only email you about SabiCheck.
          <br />
          By joining, you agree to our{" "}
          <Link
            href="/privacy"
            className="font-medium text-land-green underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
