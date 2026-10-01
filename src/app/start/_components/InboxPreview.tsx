/** What the sign-in email looks like in an inbox, so it is easy to spot. Mirrors the real template's copy. */
export function InboxPreview() {
  return (
    <figure className="fl-arrive w-full max-w-md" aria-label="What our email looks like: from Cursive, subject Your 25 leads are ready">
      <figcaption className="mb-3 text-[13px] font-medium text-[#6b7280]">Look for this</figcaption>
      <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-enterprise-md" aria-hidden="true">
        <div className="flex items-center gap-3 border-b border-[#f0f1f4] bg-[#fafbfc] px-4 py-3">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0063E6] text-sm font-semibold text-white">
            C
            <span className="fl-ping absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#0063E6] ring-2 ring-white" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-[#1d2025]">Cursive</p>
              <p className="shrink-0 text-[12px] text-[#6b7280]">now</p>
            </div>
            <p className="truncate text-[12px] text-[#6b7280]">notifications@meetcursive.com</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-[15px] font-semibold text-[#111318]">Your 25 leads are ready</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#4d5460]">
            We matched 25 decision-makers to what you sell. Open them now to see who they are and how to reach them.
          </p>
          <span className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#0063E6] px-4 text-[13px] font-semibold text-white">
            Open my 25 leads
          </span>
          <p className="mt-4 text-[12px] text-[#6b7280]">This link signs you in and works once.</p>
        </div>
      </div>
    </figure>
  )
}
