"use client";

import {
  CheckCircle2,
  CreditCard,
  Landmark,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { ApiError } from "@/lib/api/client";
import {
  formatKobo,
  verificationCodeApi,
  type CodePaymentMethod,
  type VerificationCodeOrderCreateResponse,
} from "@/lib/api/verification-codes";
import { cn } from "@/lib/cn";

const UNIT_PRICE_KOBO = 1_000;
const SERVICE_FEE_KOBO = 5_000;
const MAX_QUANTITY = 50_000;

const QUICK_QUANTITIES = [100, 500, 1_000, 5_000] as const;

type Status = "idle" | "submitting" | "success";

export function PurchaseCodesDialog({
  organizationId,
  productId,
  productName,
  batchNo,
  manufacturerPrefix,
  onClose,
  onPurchased,
}: {
  organizationId: string;
  productId: string;
  productName: string;
  batchNo: string | null;
  manufacturerPrefix: string;
  onClose: () => void;
  onPurchased: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState("100");
  const [paymentMethod, setPaymentMethod] =
    useState<CodePaymentMethod>("Card");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
    useState<VerificationCodeOrderCreateResponse | null>(null);

  const hasBatch = Boolean(batchNo?.trim());
  const hasPrefix = /^[A-Za-z0-9]{3}$/.test(manufacturerPrefix.trim());
  const parsedQuantity = Number.parseInt(quantity, 10);
  const validQuantity =
    Number.isFinite(parsedQuantity) &&
    parsedQuantity >= 1 &&
    parsedQuantity <= MAX_QUANTITY;
  const canPurchase = hasBatch && hasPrefix && validQuantity;
  const subtotalKobo = validQuantity ? parsedQuantity * UNIT_PRICE_KOBO : 0;
  const totalKobo = validQuantity
    ? subtotalKobo + SERVICE_FEE_KOBO
    : SERVICE_FEE_KOBO;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (status === "submitting") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) onClose();
  }

  async function handleContinue() {
    if (!canPurchase || status === "submitting") return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await verificationCodeApi.createOrder(
        organizationId,
        productId,
        {
          quantity: parsedQuantity,
          payment_method: paymentMethod,
        },
      );

      setResult(response);
      setStatus("success");
      onPurchased();
    } catch (cause) {
      setStatus("idle");
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We could not complete this purchase. Please try again.",
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="purchase-codes-title"
      onClose={onClose}
      onClick={handleDialogClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[min(560px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase leading-4 tracking-[0.12em] text-dash-muted">
              Unit codes
            </p>
            <h2
              id="purchase-codes-title"
              className="mt-1 font-display text-xl font-bold leading-7 text-brand-ink sm:text-2xl sm:leading-8"
            >
              {status === "success"
                ? "Payment successful"
                : "Purchase verification codes"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={status === "submitting"}
            aria-label="Close dialog"
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {status === "success" && result ? (
          <div className="mt-6">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"
            >
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
            </span>

            <p className="mt-4 text-sm leading-6 text-dash-muted">
              {result.codes_generated.toLocaleString("en-NG")} verification
              codes were generated for{" "}
              <span className="font-semibold text-brand-ink">
                {productName}
              </span>{" "}
              and are ready to print.
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-dash-line bg-canvas/50 p-4">
              <div>
                <dt className="text-xs leading-5 text-dash-muted">
                  Order reference
                </dt>
                <dd className="mt-0.5 break-all text-sm font-semibold text-brand-ink">
                  {result.order.reference}
                </dd>
              </div>
              <div>
                <dt className="text-xs leading-5 text-dash-muted">
                  Amount paid
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand-ink">
                  {formatKobo(result.order.total_amount_kobo)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl bg-dash-soft px-3.5 py-3 text-[13px] leading-5 text-dash-muted">
              This is a simulated payment. Paystack checkout can be connected
              later without changing the generated codes.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:w-auto"
              >
                Close
              </button>
              <Link
                href={`/dashboard/products/${productId}/codes`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:w-auto"
              >
                View verification codes
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-dash-muted">
              Codes are generated instantly for the product&apos;s assigned
              batch. Each code uses your manufacturer prefix and 8 random
              digits.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-dash-line bg-canvas/50 p-3.5">
                <p className="text-xs leading-5 text-dash-muted">Product</p>
                <p className="mt-0.5 break-words text-sm font-semibold text-brand-ink">
                  {productName}
                </p>
              </div>
              <div className="rounded-xl border border-dash-line bg-canvas/50 p-3.5">
                <p className="text-xs leading-5 text-dash-muted">Batch</p>
                <p className="mt-0.5 break-words text-sm font-semibold text-brand-ink">
                  {batchNo?.trim() || "Not assigned"}
                </p>
              </div>
            </div>

            {!hasBatch ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error"
              >
                This product has no manufacturing batch. Assign a batch before
                purchasing verification codes.
              </div>
            ) : null}

            {!hasPrefix ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error"
              >
                Set a three-character manufacturer prefix in{" "}
                <Link href="/dashboard/settings" className="font-semibold underline">
                  company settings
                </Link>{" "}
                before purchasing codes.
              </div>
            ) : null}

            <div className="mt-5">
              <label
                htmlFor="code-quantity"
                className="text-sm font-semibold leading-5 text-label"
              >
                Quantity
              </label>
              <input
                id="code-quantity"
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_QUANTITY}
                step={1}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError(null);
                }}
                aria-describedby="code-quantity-hint"
                aria-invalid={!validQuantity || undefined}
                className="mt-2 h-[50px] w-full rounded-xl border border-line bg-white px-4 text-base text-ink shadow-[0_1px_2px_rgb(16_24_40_/_0.02)] outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/10"
              />
              <p
                id="code-quantity-hint"
                className="mt-1.5 text-[13px] leading-5 text-muted"
              >
                Enter between 1 and {MAX_QUANTITY.toLocaleString("en-NG")}{" "}
                codes.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_QUANTITIES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setQuantity(String(value));
                      setError(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
                      parsedQuantity === value
                        ? "border-brand bg-brand/5 text-brand-ink"
                        : "border-line bg-white text-dash-muted hover:border-line-strong hover:text-brand-ink",
                    )}
                  >
                    {value.toLocaleString("en-NG")}
                  </button>
                ))}
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold leading-5 text-label">
                Payment method
              </legend>

              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "Card",
                      label: "Card",
                      description: "Debit or credit card",
                      icon: CreditCard,
                    },
                    {
                      value: "Bank Transfer",
                      label: "Bank Transfer",
                      description: "Pay from your bank app",
                      icon: Landmark,
                    },
                  ] as const
                ).map((method) => {
                  const Icon = method.icon;
                  const selected = paymentMethod === method.value;

                  return (
                    <label
                      key={method.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                        selected
                          ? "border-brand bg-brand/5"
                          : "border-line bg-white hover:border-line-strong",
                      )}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.value}
                        checked={selected}
                        onChange={() => setPaymentMethod(method.value)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          selected
                            ? "bg-brand text-white"
                            : "bg-dash-soft text-brand-ink",
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-brand-ink">
                          {method.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-4 text-dash-muted">
                          {method.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 rounded-xl border border-dash-line bg-canvas/50 p-4">
              <h3 className="text-sm font-semibold text-brand-ink">
                Order summary
              </h3>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-dash-muted">
                    Verification codes ({formatKobo(UNIT_PRICE_KOBO)} ×{" "}
                    {validQuantity
                      ? parsedQuantity.toLocaleString("en-NG")
                      : "0"}
                    )
                  </dt>
                  <dd className="shrink-0 font-semibold text-brand-ink">
                    {formatKobo(subtotalKobo)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-dash-muted">Service charges</dt>
                  <dd className="shrink-0 font-semibold text-brand-ink">
                    {formatKobo(SERVICE_FEE_KOBO)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-dash-line pt-2.5">
                  <dt className="font-semibold text-brand-ink">Total</dt>
                  <dd className="shrink-0 font-display text-lg font-bold text-brand-ink">
                    {formatKobo(totalKobo)}
                  </dd>
                </div>
              </dl>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-error/20 bg-error-soft px-3.5 py-3 text-sm leading-5 text-error"
              >
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={status === "submitting"}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canPurchase || status === "submitting"}
                aria-busy={status === "submitting" || undefined}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {status === "submitting" ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                  />
                ) : null}
                {status === "submitting"
                  ? "Processing…"
                  : "Continue to Payment"}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
