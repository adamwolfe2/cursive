import { Building2, MapPin, UsersRound, X, type LucideIcon } from 'lucide-react'
import type { FullLead } from '@/lib/free-leads/contract'
import { AnimatedNumber, formatCount } from './AnimatedNumber'
import { leadStats, type Bar, type Facet, type LeadFilter } from './lead-stats'

/** Chart cards show at most this many rows; the body height is fixed to it so loading and loaded match. */
const MAX_BARS = 4
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF]'

interface Kpi {
  label: string
  value: number | null
  sub: string | null
  accent?: boolean
}

/**
 * The list at a glance: one KPI strip and three breakdowns, every figure counted from the delivered leads
 * (plus the live match total). Each bar filters the table. While loading, the same boxes hold their size
 * so the table never moves.
 */
export function LeadsOverview({
  leads,
  totalMatching,
  filter,
  onFilter,
  shown,
}: {
  leads: FullLead[] | null
  totalMatching: number | null
  filter: LeadFilter | null
  onFilter: (f: LeadFilter | null) => void
  /** Rows the table shows under the current filter. */
  shown: number
}) {
  const s = leads ? leadStats(leads, MAX_BARS) : null
  const pct = (n: number) => (s && s.total ? Math.round((n / s.total) * 100) : 0)

  const kpis: Kpi[] = s
    ? [
        { label: 'Match your profile', value: Math.max(totalMatching ?? 0, s.total), sub: 'people, counted just now', accent: true },
        { label: 'In your list', value: s.total, sub: 'each with a work email' },
        s.deciders === null
          ? { label: 'On LinkedIn', value: s.linkedin, sub: `${pct(s.linkedin)}% of the list` }
          : { label: 'Decision makers', value: s.deciders, sub: `${pct(s.deciders)}% of the list` },
        { label: 'Companies', value: s.companies, sub: s.locations ? `across ${s.locations} ${s.locations === 1 ? 'location' : 'locations'}` : null },
        { label: 'Direct lines', value: s.phone, sub: s.deciders === null ? 'phone numbers' : `${s.linkedin} on LinkedIn too` },
      ]
    : ['Match your profile', 'In your list', 'Decision makers', 'Companies', 'Direct lines'].map((label) => ({ label, value: null, sub: null }))

  const pick = (facet: Facet) => (b: Bar) =>
    onFilter(filter?.facet === facet && filter.key === b.key ? null : { facet, key: b.key, label: b.label })

  return (
    <section aria-label="Your list at a glance" className="mt-8">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#e5e7eb] sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <div key={k.label} className={`bg-white px-4 py-3.5 sm:px-5 sm:py-4 ${i === 0 ? 'max-sm:col-span-2' : ''}`}>
            <dt className="text-[13px] font-medium text-[#6b7280]">{k.label}</dt>
            <dd className="mt-1">
              {k.value === null ? (
                <span className="fl-sheen-ink block h-7 w-16 rounded-md" aria-hidden="true" />
              ) : (
                <>
                  <AnimatedNumber
                    value={k.value}
                    from={0}
                    duration={1100 + i * 120}
                    className={`block text-[1.75rem] font-semibold leading-7 tabular-nums tracking-[-0.03em] ${k.accent ? 'text-[#0063E6]' : 'text-[#111318]'}`}
                  />
                  <span className="sr-only">{formatCount(k.value)}</span>
                </>
              )}
              <span className="mt-1 block h-[1.125rem] truncate text-[13px] leading-[1.125rem] text-[#6b7280]">{k.sub ?? ''}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* Phones: the three breakdowns scroll sideways so the list itself stays near the top. */}
      <div className="-mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
        <BarCard icon={UsersRound} title="Seniority" bars={s?.seniority ?? null} total={s?.total ?? 0} active={filter?.facet === 'seniority' ? filter.key : null} onPick={pick('seniority')} />
        <BarCard icon={Building2} title="Company size" bars={s?.sizes ?? null} total={s?.total ?? 0} active={filter?.facet === 'size' ? filter.key : null} onPick={pick('size')} />
        <BarCard
          icon={MapPin}
          title="Top locations"
          bars={s?.places ?? null}
          total={s?.total ?? 0}
          note={s && s.otherPlaces > 0 ? `+${s.otherPlaces} elsewhere` : null}
          active={filter?.facet === 'place' ? filter.key : null}
          onPick={pick('place')}
        />
      </div>

      {/* One reserved line: the hint and the active filter swap in place. */}
      <div className="mt-3 flex min-h-11 items-center gap-3 text-[13px] text-[#4d5460]" role="status">
        {filter ? (
          <>
            <span>
              Showing <span className="font-semibold text-[#1d2025]">{shown}</span> of {s?.total ?? 0}:{' '}
              <span className="font-semibold text-[#0063E6]">{filter.label}</span>
            </span>
            <button
              type="button"
              onClick={() => onFilter(null)}
              className={`inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-semibold text-[#1d2025] hover:bg-[#f3f4f6] ${FOCUS}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Show all
            </button>
          </>
        ) : (
          <span className={s ? 'fl-fade' : 'invisible'}>Tap any bar to filter the list.</span>
        )}
      </div>
    </section>
  )
}

function BarCard({
  icon: Icon,
  title,
  bars,
  total,
  note = null,
  active,
  onPick,
}: {
  icon: LucideIcon
  title: string
  bars: Bar[] | null
  total: number
  note?: string | null
  active: string | null
  onPick: (b: Bar) => void
}) {
  // Keep the biggest rows when there are more than fit, in their original order.
  const top = bars && bars.length > MAX_BARS ? new Set([...bars].sort((x, y) => y.count - x.count).slice(0, MAX_BARS)) : null
  const shown = bars && top ? bars.filter((b) => top.has(b)) : bars
  const hidden = bars && shown ? bars.reduce((n, b) => n + b.count, 0) - shown.reduce((n, b) => n + b.count, 0) : 0
  const caption = note ?? (hidden > 0 ? `+${hidden} in other bands` : null)
  const max = Math.max(1, ...(shown ?? []).map((b) => b.count))
  const lead = shown?.length ? shown.reduce((a, b) => (b.count > a.count ? b : a)) : null
  return (
    <figure className="flex w-[82%] shrink-0 snap-start flex-col rounded-xl border border-[#e5e7eb] bg-white p-4 sm:w-auto sm:p-5">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#1d2025]">
          <Icon className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          {title}
        </span>
        <span className="text-[12px] text-[#6b7280]">{bars ? (caption ?? `of ${total} leads`) : ''}</span>
      </figcaption>
      <ul className="mt-3 h-[11.75rem] space-y-1 sm:h-[8.75rem]" role="list" aria-label={`${title}, number of leads`}>
        {shown === null
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex h-11 items-center gap-3 px-2 sm:h-8" aria-hidden="true">
                <span className="fl-sheen-ink h-3 w-24 rounded" />
                <span className="fl-sheen-ink h-2 flex-1 rounded-full" />
              </li>
            ))
          : shown.length === 0
            ? <li className="flex h-8 items-center px-2 text-[13px] text-[#6b7280]">Not listed for these leads.</li>
            : shown.map((b, i) => {
                const on = active === b.key
                const dim = active !== null && !on
                return (
                  <li key={b.key}>
                    <button
                      type="button"
                      onClick={() => onPick(b)}
                      aria-pressed={on}
                      aria-label={`${b.label}: ${b.count} of ${total}. ${on ? 'Showing only these. Press to show all.' : 'Show only these.'}`}
                      className={`group grid h-11 w-full grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_1.75rem] items-center gap-3 rounded-md px-2 text-left text-[13px] transition-[background-color,opacity] duration-200 sm:h-8 ${on ? 'bg-[#e8f1ff]' : 'hover:bg-[#f5f8fd]'} ${dim ? 'opacity-55 hover:opacity-100' : ''} ${FOCUS}`}
                    >
                      <span className={`truncate ${on ? 'font-semibold text-[#084fba]' : 'text-[#3a3f4b]'}`} title={b.label}>{b.label}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-[#eef3fb]" aria-hidden="true">
                        <span
                          className={`fl-grow block h-full rounded-full transition-colors duration-200 ${on ? 'bg-[#084fba]' : 'bg-[#0063E6] group-hover:bg-[#084fba]'}`}
                          style={{ width: `${Math.max(4, (b.count / max) * 100)}%`, animationDelay: `${300 + i * 70}ms` }}
                        />
                      </span>
                      <span className="text-right font-semibold tabular-nums text-[#1d2025]">{b.count}</span>
                    </button>
                  </li>
                )
              })}
      </ul>
      <p className="mt-3 h-[1.125rem] truncate border-t border-[#f3f4f6] pt-3 text-[12px] leading-[1.125rem] text-[#6b7280] [box-sizing:content-box]">
        {lead && total ? (
          <>
            Largest group: <span className="font-semibold text-[#1d2025]">{lead.label}</span>, {Math.round((lead.count / total) * 100)}%
          </>
        ) : (
          ''
        )}
      </p>
    </figure>
  )
}
