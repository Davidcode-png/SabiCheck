const ACTIVITY_BARS = [40, 56, 44, 66, 58, 78, 68, 90, 72, 100];

export function WorkspaceMock() {
  return (
    <div
      role="img"
      aria-label="Illustrative preview of a SabiCheck manufacturer workspace showing 24 products, 8,420 verification checks and a verification activity chart"
      className="rounded-3xl border border-[#e6eee9] bg-white p-6 shadow-[0_28px_70px_-50px_rgba(0,69,36,0.45)] sm:p-7"
    >
      <div aria-hidden="true">
        <p className="font-display text-[20px] font-bold text-land-ink">
          Your product workspace
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-land-muted">
          Illustrative data
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#f7f9f8] px-4 py-4">
            <p className="text-[12px] text-land-muted">Registered products</p>
            <p className="mt-1 font-display text-[28px] font-bold leading-none text-land-ink">
              24
            </p>
          </div>
          <div className="rounded-xl bg-[#f7f9f8] px-4 py-4">
            <p className="text-[12px] text-land-muted">Verification checks</p>
            <p className="mt-1 font-display text-[28px] font-bold leading-none text-land-ink">
              8,420
            </p>
          </div>
        </div>

        <p className="mt-7 text-[15px] font-semibold text-land-ink">
          Verification activity
        </p>

        <div className="mt-4 flex h-[148px] items-end gap-2">
          {ACTIVITY_BARS.map((height, index) => (
            <div
              key={`${height}-${index}`}
              style={{ height: `${height}%` }}
              className={
                index === ACTIVITY_BARS.length - 1
                  ? "flex-1 rounded-t-[3px] bg-land-accent"
                  : "flex-1 rounded-t-[3px] bg-[#bce8d1]"
              }
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#e9f0eb] pt-5">
          <p className="text-[14px] font-medium text-land-ink">
            Consumer reports
          </p>
          <p className="rounded-full bg-land-mint px-4 py-1.5 text-[12px] font-semibold text-land-green">
            3 under review
          </p>
        </div>
      </div>
    </div>
  );
}
