"use client";

import { Flag, Sparkles, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { ReportPriorityBadge } from "@/components/reports/report-priority-badge";
import { FormAlert } from "@/components/ui/form-alert";
import { SelectField } from "@/components/ui/select-field";
import { ApiError } from "@/lib/api/client";
import { distributorApi, type Distributor } from "@/lib/api/distributors";
import {
  organizationApi,
  type OrganizationMember,
} from "@/lib/api/organizations";
import {
  REPORT_PRIORITY_OPTIONS,
  REPORT_STATUS_OPTIONS,
  reportApi,
  type ConsumerReport,
  type ReportPriority,
  type ReportStatus,
  type ReportTriage,
  type TriageConfidence,
} from "@/lib/api/reports";

const CONFIDENCE_STYLES: Record<TriageConfidence, string> = {
  low: "bg-dash-soft text-dash-muted",
  medium: "bg-[#fff8d6] text-[#8a6a00]",
  high: "bg-dash-tint text-dash-teal",
};

const CONFIDENCE_LABELS: Record<TriageConfidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

function formatGenerated(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function flagLabel(flag: string) {
  return flag.replace(/_/g, " ");
}

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
  const [priority, setPriority] = useState<ReportPriority>(
    report.priority ?? "normal",
  );
  const [reviewerId, setReviewerId] = useState(report.reviewer?.id ?? "");
  const [distributorId, setDistributorId] = useState(
    report.distributor?.id ?? "",
  );
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [triage, setTriage] = useState<ReportTriage | null>(
    report.ai_triage ?? null,
  );
  const [triaging, setTriaging] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);

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

  async function runTriage() {
    if (triaging) return;

    setTriaging(true);
    setTriageError(null);

    try {
      const updated = await reportApi.triage(organizationId, report.id);
      setTriage(updated.ai_triage);
      // Refresh the table behind the dialog so its AI marker stays in sync.
      onSaved();
    } catch (cause) {
      setTriageError(
        cause instanceof ApiError
          ? cause.message
          : "We could not run AI triage. Please review this case manually.",
      );
    } finally {
      setTriaging(false);
    }
  }

  function applySuggestion() {
    if (!triage) return;

    setPriority(triage.priority);
    setStatus((current) =>
      current === "received" ? "under_review" : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await reportApi.update(organizationId, report.id, {
        status,
        priority,
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
          Assign a reviewer and distributor, then set the case priority and
          status.
        </p>

        <div className="mt-5 rounded-xl border border-dash-line bg-dash-canvas/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-ink ring-1 ring-dash-line">
                <Sparkles
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-brand-ink">
                  AI triage
                </p>
                <p className="text-[11px] leading-4 text-dash-muted">
                  Advisory only. You make the final call.
                </p>
              </div>
            </div>

            {triage ? (
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold leading-4 ${CONFIDENCE_STYLES[triage.confidence]}`}
              >
                {CONFIDENCE_LABELS[triage.confidence]}
              </span>
            ) : null}
          </div>

          {triageError ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-error/20 bg-error-soft px-3 py-2 text-xs leading-5 text-error"
            >
              {triageError}
            </p>
          ) : null}

          {triaging ? (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-dash-muted">
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-dash-line border-t-brand motion-reduce:animate-none"
              />
              Reading the report…
            </div>
          ) : triage ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-6 text-brand-ink">
                {triage.summary}
              </p>

              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-dash-muted">
                    Suggested concern
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-brand-ink">
                    {triage.suggested_concern ?? "No change suggested"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-dash-muted">
                    Suggested priority
                  </dt>
                  <dd className="mt-1">
                    <ReportPriorityBadge priority={triage.priority} />
                  </dd>
                </div>
              </dl>

              {triage.priority_reason ? (
                <p className="text-xs leading-5 text-dash-muted">
                  {triage.priority_reason}
                </p>
              ) : null}

              {triage.duplicate_reference ? (
                <p className="rounded-lg bg-white px-3 py-2 text-xs leading-5 text-brand-ink ring-1 ring-dash-line">
                  Possible duplicate:{" "}
                  <span className="font-mono font-semibold">
                    {triage.duplicate_reference}
                  </span>
                </p>
              ) : null}

              {triage.suggested_next_step ? (
                <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-dash-line">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-dash-muted">
                    Suggested next step
                  </p>
                  <p className="mt-1 text-sm leading-5 text-brand-ink">
                    {triage.suggested_next_step}
                  </p>
                </div>
              ) : null}

              {triage.flags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {triage.flags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium leading-4 text-dash-muted ring-1 ring-dash-line"
                    >
                      {flagLabel(flag)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={applySuggestion}
                  disabled={triaging || submitting}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-brand-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply to form
                </button>
                <button
                  type="button"
                  onClick={runTriage}
                  disabled={triaging || submitting}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-3 text-xs font-semibold text-brand-ink transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>
                <span className="text-[11px] leading-4 text-dash-muted">
                  {triage.model} · {formatGenerated(triage.generated_at)}
                </span>
              </div>

              <p className="text-[11px] leading-4 text-dash-muted">
                Apply to form sets the priority and moves received cases to
                under review. The consumer&apos;s original concern is never
                overwritten.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={runTriage}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-ink px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#032f17] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Run AI triage
              </button>
              <p className="mt-2 text-[11px] leading-4 text-dash-muted">
                Summarises the report, suggests a priority, and checks for
                likely duplicates. No verdict on authenticity.
              </p>
            </div>
          )}
        </div>

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
            label="Priority"
            name="priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as ReportPriority)
            }
            options={REPORT_PRIORITY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            hint="Urgent cases are the ones your team should review first."
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
