"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";

export type ProductActionDialogContent = {
  title: string;
  body: string;
} | null;

export function ProductActionDialog({
  content,
  onClose,
}: {
  content: ProductActionDialogContent;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (content && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }

    if (!content && dialog.open) {
      dialog.close();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [content]);

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="product-action-title"
      onClose={onClose}
      onClick={handleDialogClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[min(460px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35"
    >
      {content ? (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase leading-4 tracking-[0.12em] text-dash-muted">
                Demo workspace
              </p>
              <h2
                id="product-action-title"
                className="mt-1 font-display text-xl font-bold leading-7 text-brand-ink"
              >
                {content.title}
              </h2>
            </div>

            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-dash-muted">
            {content.body}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            Close
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
