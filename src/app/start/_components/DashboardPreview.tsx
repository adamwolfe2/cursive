import type { FullLead } from '@/lib/free-leads/contract'

/**
 * What a built dashboard looks like, in the shape of the ones we run for clients: sidebar, a KPI strip,
 * a weekly chart and a "reach out today" list. The people listed are the reader's own first leads; every
 * pipeline number is example data and labeled so, like the client demos. Decorative for screen readers.
 */
const KPIS: Array<[string, string, string]> = [
  ['New leads', '25', 'this week'],
  ['Replies', '14', '+5'],
  ['Meetings', '6', '+2'],
  ['Pipeline', '$184k', '+18%'],
]
const WEEKS = [3, 5, 4, 7, 6, 9, 11, 14]
const NAV = ['Today', 'Leads', 'Pipeline', 'Replies', 'Meetings']

export function DashboardPreview({ website, leads }: { website: string | null; leads: FullLead[] }) {
  const domain = website?.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '') || 'your company'
  const people = leads.slice(0, 3)
  const peak = Math.max(...WEEKS)
  return (
    <figure aria-label={`Example dashboard for ${domain}, with your first leads in it`} className="select-none">
      <div className="fl-tilt overflow-hidden rounded-xl border border-[#e5e7eb] bg-white text-left shadow-enterprise-md" aria-hidden="true">
        <div className="grid grid-cols-[2.75rem_1fr] sm:grid-cols-[9rem_1fr]">
          <div className="border-r border-[#f0f1f4] bg-[#fafbfc] p-2.5 sm:p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#0063E6] text-[11px] font-semibold uppercase text-white">
                {domain[0]}
              </span>
              <span className="hidden truncate text-[11px] font-semibold text-[#1d2025] sm:block">{domain}</span>
            </div>
            <div className="mt-4 space-y-0.5">
              {NAV.map((item, i) => (
                <div key={item} className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 ${i === 0 ? 'bg-[#e8f1ff]' : ''}`}>
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${i === 0 ? 'bg-[#0063E6]' : 'bg-[#d1d5db]'}`} />
                  <span className={`hidden text-[11px] font-medium sm:inline ${i === 0 ? 'text-[#084fba]' : 'text-[#6b7280]'}`}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex h-9 items-center justify-between gap-2 border-b border-[#f0f1f4] px-3 sm:px-4">
              <span className="truncate text-[11px] text-[#6b7280]">
                {domain} <span className="px-1">/</span> <span className="font-medium text-[#1d2025]">Today</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-[#f5d9a8] bg-[#fff8eb] px-2 py-0.5 text-[10px] font-medium text-[#8a5a00]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d98e04]" />
                Example data
              </span>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#eceef2] bg-[#eceef2] sm:grid-cols-4">
                {KPIS.map(([label, value, delta]) => (
                  <div key={label} className="min-w-0 bg-white px-2.5 py-2">
                    <p className="truncate text-[10px] text-[#6b7280]">{label}</p>
                    <p className="text-[15px] font-semibold tabular-nums tracking-[-0.02em] text-[#111318]">{value}</p>
                    <p className="truncate text-[9.5px] font-medium text-[#15803d]">{delta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-[#eceef2] p-2.5">
                <p className="text-[10px] font-semibold text-[#1d2025]">Replies by week</p>
                <div className="mt-2 flex h-14 items-end gap-1.5">
                  {WEEKS.map((v, i) => (
                    <span
                      key={i}
                      className={`fl-rise-bar flex-1 rounded-t-[3px] ${i === WEEKS.length - 1 ? 'bg-[#0063E6]' : 'bg-[#b8d4fb]'}`}
                      style={{ height: `${(v / peak) * 100}%`, animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>
              </div>
              {people.length > 0 && (
                <div className="mt-3 rounded-lg border border-[#eceef2]">
                  <p className="border-b border-[#f0f1f4] px-2.5 py-1.5 text-[10px] font-semibold text-[#1d2025]">Reach out today</p>
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 border-b border-[#f6f7f9] px-2.5 py-1.5 last:border-b-0">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[8.5px] font-semibold text-[#084fba]">
                        {p.first_name[0]}
                        {p.last_name[0]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-[#1d2025]">
                        <span className="font-semibold">
                          {p.first_name} {p.last_name}
                        </span>{' '}
                        <span className="text-[#6b7280]">{p.company}</span>
                      </span>
                      <span className="shrink-0 rounded border border-[#d6e6fd] px-1.5 text-[9.5px] font-medium text-[#084fba]">New</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
