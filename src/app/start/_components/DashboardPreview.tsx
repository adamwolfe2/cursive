/** Illustrative operating dashboard, drawn in CSS + SVG so it stays crisp and weighs nothing. Decorative only. */
const STAGES: Array<[string, number]> = [
  ['New leads', 100],
  ['Contacted', 72],
  ['Replied', 38],
  ['Meeting', 21],
  ['Won', 9],
]

export function DashboardPreview() {
  return (
    <figure aria-label="Example of a custom sales dashboard" className="select-none">
      <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-enterprise-md" aria-hidden="true">
        <div className="flex h-9 items-center gap-1.5 border-b border-[#f3f4f6] bg-[#f9fafb] px-3.5">
          <span className="h-2 w-2 rounded-full bg-[#d1d5db]" />
          <span className="h-2 w-2 rounded-full bg-[#d1d5db]" />
          <span className="h-2 w-2 rounded-full bg-[#d1d5db]" />
          <span className="ml-3 text-[11px] font-medium text-[#6b7280]">Revenue, this quarter</span>
        </div>
        <div className="grid grid-cols-[3rem_1fr] sm:grid-cols-[8.5rem_1fr]">
          <div className="space-y-2 border-r border-[#f3f4f6] p-3">
            {['Overview', 'Pipeline', 'Outreach', 'Clients'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 0 ? 'bg-[#f0f7ff]' : ''}`}>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${i === 0 ? 'bg-[#007AFF]' : 'bg-[#d1d5db]'}`} />
                <span className={`hidden text-[11px] font-medium sm:inline ${i === 0 ? 'text-[#0063E6]' : 'text-[#6b7280]'}`}>{item}</span>
              </div>
            ))}
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Pipeline', '$412k', '+18%'],
                ['Replies', '164', '+42'],
                ['Won', '$96k', '+11%'],
              ].map(([label, value, delta]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[10px] font-medium text-[#6b7280]">{label}</p>
                  <p className="text-base font-semibold tabular-nums tracking-[-0.02em] text-[#111318] sm:text-lg">{value}</p>
                  <p className="text-[10px] font-medium text-[#15803d]">{delta}</p>
                </div>
              ))}
            </div>
            <svg viewBox="0 0 320 96" className="mt-4 h-24 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fl-dash-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[24, 48, 72].map((y) => (
                <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              ))}
              <path d="M0 80 L40 74 L80 76 L120 60 L160 62 L200 44 L240 40 L280 26 L320 18 L320 96 L0 96 Z" fill="url(#fl-dash-area)" />
              <path
                d="M0 80 L40 74 L80 76 L120 60 L160 62 L200 44 L240 40 L280 26 L320 18"
                fill="none"
                stroke="#007AFF"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <path d="M0 88 L40 86 L80 84 L120 82 L160 78 L200 76 L240 70 L280 66 L320 62" fill="none" stroke="#a0a5b1" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="mt-4 space-y-1.5">
              {STAGES.map(([stage, pct]) => (
                <div key={stage} className="grid grid-cols-[4.5rem_1fr] items-center gap-2 sm:grid-cols-[5.5rem_1fr]">
                  <span className="truncate text-[10px] font-medium text-[#6b7280]">{stage}</span>
                  <span className="h-2 rounded-sm bg-[#f3f4f6]">
                    <span className="block h-2 rounded-sm bg-[#3d9bff]" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
