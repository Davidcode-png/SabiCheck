import { Plus } from "lucide-react";

export function ConsumerReportMock() {
  return (
    <div
      role="img"
      aria-label="Illustrative preview of the SabiCheck consumer report form"
      className="rounded-3xl border border-[#e6eee9] bg-white p-6 shadow-[0_28px_70px_-50px_rgba(0,69,36,0.45)] sm:p-8"
    >
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] font-semibold text-land-green">
            SabiCheck / Consumer report
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-land-green">
            Web
          </p>
        </div>

        <p className="mt-7 font-display text-[26px] font-bold leading-8 text-land-green sm:text-[28px]">
          Something doesn&rsquo;t look right?
        </p>
        <p className="mt-3 text-[15px] leading-6 text-land-muted">
          Tell us what you noticed.
        </p>

        <div className="mt-6">
          <p className="text-[13px] font-semibold text-land-ink">
            Product name
          </p>
          <div className="mt-2 rounded-lg bg-land-canvas px-4 py-3 text-[14px] text-land-muted">
            Enter the name on the pack
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[13px] font-semibold text-land-ink">
            What concerns you?
          </p>
          <div className="mt-2 h-[78px] rounded-lg bg-land-canvas px-4 py-3 text-[14px] text-land-muted">
            Describe what looks suspicious...
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-[#b9cdc0] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-land-ink">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add photos (optional)
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-land-muted">
            Web reports only. You can report without a photo.
          </p>
        </div>

        <div className="mt-5 flex h-12 items-center justify-center gap-2 rounded-lg bg-land-green text-[15px] font-semibold text-white">
          Submit a report
          <span aria-hidden="true">&rarr;</span>
        </div>

        <p className="mt-5 text-[12px] text-land-muted">
          Illustrative reporting preview
        </p>
      </div>
    </div>
  );
}
