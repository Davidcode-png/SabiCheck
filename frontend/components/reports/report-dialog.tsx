"use client";

import { Flag, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { FormAlert } from "@/components/ui/form-alert";
import { SelectField } from "@/components/ui/select-field";
import { ApiError } from "@/lib/api/client";
import { distributorApi, type Distributor } from "@/lib/api/distributors";
import {
  organizationApi,
  type OrganizationMember,
} from "@/lib/api/organizations";
import {
  REPORT_STATUS_OPTIONS,
  reportApi,
  type ConsumerReport,
  type ReportStatus,
} from "@/lib/api/reports";

export function ReportDialog({
  organizationId,
  report,
  onClose,
  onSaved,
}: {
  organizationId: string;
  report: ConsumerReport;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [reviewerId, setReviewerId] = useState(report.reviewer?.id ?? "");
  const [distributorId, setDistributorId] = useState(
    report.distributor?.id ?? "",
  );
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [memberList, distributorList] = await Promise.all([
          organizationApi.listMembers(organizationId),
          distributorApi.list(organizationId, { pageSize: 100 }),
        ]);
        if (cancelled) return;
        setMembers(memberList);
        setDistributors(distributorList.items);
      } catch {
        if (cancelled) return;
        setFormError(
          "We could not load reviewers and distributors. You can still change the status.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (submitting) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await reportApi.update(organizationId, report.id, {
        status,
        reviewer_id: reviewerId || null,
        distributor_id: distributorId || null,
      });
      onSaved();
      onClose();
    } catch (cause) {
      setFormError(
        cause instanceof ApiError
          ? cause.message
          : "We could not update this case. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="report-dialog-title"
      onClose={onClose}
      onClick={handleDialogClick}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[min(560px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase leading-4 tracking-[0.12em] text-dash-muted">
              Case {report.reference}
            </p>
            <h2
              id="report-dialog-title"
              className="mt-1 font-display text-xl font-bold leading-7 text-brand-ink sm:text-2xl sm:leading-8"
            >
              Triage this report
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-dash-muted">
          Assign a reviewer and distributor, then set the case status.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <SelectField
            label="Status"
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReportStatus)
            }
            options={REPORT_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <SelectField
            label={
              <>
                Reviewer{" "}
                <span className="font-normal text-muted">
                  &middot; Optional
                </span>
              </>
            }
            name="reviewer_id"
            value={reviewerId}
            onChange={(event) => setReviewerId(event.target.value)}
            disabled={loading}
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((member) => ({
                value: member.user_id,
                label: `${member.full_name} · ${member.role}`,
              })),
            ]}
            hint={
              loading ? "Loading organization members…" : undefined
            }
          />

          <SelectField
            label={
              <>
                Distributor{" "}
                <span className="font-normal text-muted">
                  &middot; Optional
                </span>
              </>
            }
            name="distributor_id"
            value={distributorId}
            onChange={(event) => setDistributorId(event.target.value)}
            disabled={loading}
            options={[
              { value: "", label: "Not linked" },
              ...distributors.map((distributor) => ({
                value: distributor.id,
                label: `${distributor.name} · ${distributor.tracking_code}`,
              })),
            ]}
            hint={
              loading ? "Loading distributors…" : undefined
            }
          />

          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                />
              ) : (
                <Flag aria-hidden="true" className="h-4 w-4" />
              )}
              {submitting ? "Saving…" : "Save case"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
