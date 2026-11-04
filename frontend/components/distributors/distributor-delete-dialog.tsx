"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

export function DistributorDeleteDialog({
  distributorName,
  onClose,
  onDelete,
}: {
  distributorName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (deleting) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      await onDelete();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not remove this distributor. Please try again.",
      );
      setDeleting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="distributor-delete-title"
      aria-describedby="distributor-delete-description"
      onClose={onClose}
      onClick={handleDialogClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[min(460px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error-soft text-error"
          >
            <AlertTriangle className="h-5 w-5" strokeWidth={1.9} />
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close dialog"
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <h2
          id="distributor-delete-title"
          className="mt-4 font-display text-xl font-bold leading-7 text-brand-ink"
        >
          Remove this distributor?
        </h2>

        <p
          id="distributor-delete-description"
          className="mt-2 text-sm leading-6 text-dash-muted"
        >
          <span className="font-semibold text-brand-ink">
            {distributorName}
          </span>{" "}
          will be removed from your distribution list. This cannot be undone.
        </p>

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
            autoFocus
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-busy={deleting || undefined}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-error px-5 text-sm font-semibold text-white transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {deleting ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
              />
            ) : null}
            {deleting ? "Removing…" : "Remove distributor"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
