'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import { PageLine } from './ScanFeed'
import type { PageRow } from './scan-state'

/**
 * The hero's live example: a scan of a sample company playing out in the same order, and with the same
 * row styles, as the real scan view (pages read, then the blue buyer profile, then people). Example data,
 * labeled so. Pauses while the reader types, hovers or presses pause; static under reduced motion.
 */
type Example = {
  tab: string
  domain: string
  pages: Array<[path: string, chars: number]>
  summary: string
  rows: Array<[label: string, values: string[]]>
  count: number
  leads: Array<[name: string, title: string, company: string, email: string, why: string]>
}

const EXAMPLES: Example[] = [
  {
    tab: 'SOC 2 audits',
    domain: 'vantacheck.io',
    pages: [['/', 12_408], ['/pricing', 3_221], ['/customers', 5_870]],
    summary: 'Software companies getting ready for their first enterprise security review.',
    rows: [
      ['Titles', ['CTO', 'Head of Security', 'VP of Engineering']],
      ['Size', ['11-50 people', '51-200 people', '201-500 people']],
      ['Where', ['United States']],
    ],
    count: 3947,
    leads: [
      ['Rachel J.', 'VP of Engineering', 'Ledgerline', 'r•••@ledgerline.com', 'Runs engineering at a 120-person fintech that just signed its first bank.'],
      ['Marcus O.', 'CTO', 'Shipfast', 'm•••@shipfast.dev', 'Series A dev tools company hiring its first security lead.'],
      ['Priya R.', 'Head of Security', 'Northwind Health', 'p•••@northwindhealth.io', 'Owns vendor reviews at a health company selling into hospitals.'],
    ],
  },
  {
    tab: 'Bookkeeping',
    domain: 'brightledger.com',
    pages: [['/', 8_912], ['/services', 4_105], ['/about', 2_640]],
    summary: 'Dental practices with 2 to 10 locations, where the owner still signs payroll.',
    rows: [
      ['Titles', ['COO', 'Practice Owner', 'Office Manager']],
      ['Industry', ['Dental offices']],
      ['Where', ['Ohio', 'Indiana', 'Michigan']],
    ],
    count: 2316,
    leads: [
      ['Hannah K.', 'Practice Owner', 'Lakeside Family Dental', 'h•••@lakesidefamilydental.com', 'Owns four practices around Columbus and still runs payroll herself.'],
      ['Tomas R.', 'Office Manager', 'Brightpath Orthodontics', 't•••@brightpathortho.com', 'Runs billing and the front desk across three locations.'],
      ['Ravi S.', 'Founder', 'Summit Smiles', 'r•••@summitsmiles.com', 'Opened a third location this spring, so the books just got harder.'],
    ],
  },
  {
    tab: 'Freight',
    domain: 'loadwell.co',
    pages: [['/', 10_377], ['/how-it-works', 6_214], ['/pricing', 2_958]],
    summary: 'Manufacturers shipping hundreds of loads a month who pay freight invoices by hand.',
    rows: [
      ['Titles', ['Controller', 'VP of Supply Chain', 'Logistics Director']],
      ['Size', ['201-500 people', '501-1,000 people']],
      ['Industry', ['Manufacturing']],
    ],
    count: 6104,
    leads: [
      ['Greg M.', 'VP of Supply Chain', 'Hartline Fabrication', 'g•••@hartlinefab.com', 'Ships out of three plants in Ohio and owns the carrier contracts.'],
      ['Nadia F.', 'Logistics Director', 'Coastal Packaging', 'n•••@coastalpack.com', 'Switched 3PLs this year; the freight invoices land on her desk.'],
      ['Owen P.', 'Controller', 'Ridgeway Components', 'o•••@ridgewaycomp.com', 'Signs off on freight spend, which keeps growing as a share of cost.'],
    ],
  },
]

/** ms from the start of an example at which each step begins; the last entry hands over to the next example. */
const AT = [0, 750, 1150, 1550, 1950, 2400, 2800, 3100, 3400, 3800, 4400, 4900, 5400, 10_500]
const PAGES_DONE = 4
const SUMMARY = 5
const FIRST_ROW = 6
const COUNT = 9
const FIRST_LEAD = 10
const LAST = AT.length - 2
const CYCLE_MS = AT[AT.length - 1]

export function HeroDemo({ held }: { held: boolean }) {
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState(0)
  /** Bumped whenever an example (re)starts, so its progress bar and entrance motion restart too. */
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [still, setStill] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setStill(true)
    setStep(LAST)
  }, [])

  const stopped = still || paused || held || hovered
  useEffect(() => {
    if (stopped) return
    const t = window.setTimeout(() => {
      if (step + 1 < AT.length - 1) return setStep(step + 1)
      setIndex((i) => (i + 1) % EXAMPLES.length)
      setStep(0)
      setRun((r) => r + 1)
    }, AT[step + 1] - AT[step])
    return () => window.clearTimeout(t)
  }, [step, stopped])

  const pick = (i: number) => {
    setIndex(i)
    setStep(still ? LAST : 0)
    setRun((r) => r + 1)
  }

  const ex = EXAMPLES[index]
  const pages: PageRow[] = ex.pages.slice(0, Math.min(step, 3)).map(([path, chars], i) => ({
    path,
    state: i < step - 1 ? 'read' : 'fetching',
    title: null,
    chars,
  }))
  const readAll = step >= PAGES_DONE

  return (
    <figure
      className="relative min-w-0"
      aria-label={`Example scan of ${ex.domain}, a sample company, and the buyers it finds`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2">
        <div role="group" aria-label="Pick an example" className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {EXAMPLES.map((e, i) => (
            <button
              key={e.domain}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={i === index}
              className={`relative min-h-11 shrink-0 overflow-hidden rounded-lg border px-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] ${
                i === index
                  ? 'border-[#cfe3ff] bg-white text-[#0c1f45] shadow-[0_1px_2px_rgb(12_31_69/0.08)]'
                  : 'border-transparent text-[#4b5563] hover:bg-[#eef4fc] hover:text-[#111827]'
              }`}
            >
              {e.tab}
              {i === index && !still && (
                <span
                  key={run}
                  aria-hidden="true"
                  className="fl-fill absolute inset-x-0 bottom-0 h-0.5 bg-[#007AFF]"
                  style={{ animationDuration: `${CYCLE_MS}ms`, animationPlayState: stopped ? 'paused' : 'running' }}
                />
              )}
            </button>
          ))}
        </div>
        {!still && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play the example' : 'Pause the example'}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[#4b5563] transition-colors hover:bg-[#eef4fc] hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
          >
            {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div
        key={run}
        aria-hidden="true"
        className="mt-3 overflow-hidden rounded-2xl border border-[#dfe7f2] bg-white shadow-[0_24px_60px_-28px_rgb(12_31_69/0.28)]"
      >
        {/* Address row: the site being typed in, then what the scan is doing. */}
        <div className="flex h-12 items-center gap-3 border-b border-[#eef1f5] bg-[#fafbfd] px-4">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#007AFF] text-[11px] font-semibold uppercase text-white">
            {ex.domain[0]}
          </span>
          <span className="relative min-w-0 flex-1 truncate text-[14px] font-semibold text-[#111827]">
            <span className={still ? '' : 'fl-type inline-block'}>{ex.domain}</span>
          </span>
          {/* Fixed width, so the label changing never moves anything. */}
          <span className="w-24 shrink-0 text-left text-[12px] font-medium text-[#4b5563]">
            {readAll ? (step >= COUNT ? 'Done' : 'Finding buyers') : step > 0 ? 'Reading pages' : ''}
          </span>
          <span className="shrink-0 rounded-full border border-[#f5d9a8] bg-[#fff8eb] px-2 py-0.5 text-[11px] font-medium text-[#8a5a00]">
            Example
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="h-5 text-[12px] font-medium text-[#111827]">
              {readAll ? `Read ${ex.pages.length} pages` : step > 0 ? 'Opening pages' : 'Pages'}
            </p>
            <ul className="mt-2 grid h-[5.25rem] content-start gap-x-4 gap-y-1 sm:h-6 sm:grid-cols-3">
              {pages.map((p) => (
                <PageLine key={p.path} page={p} first={false} />
              ))}
            </ul>
          </div>

          {/* Mirrors the real buyer profile card, shrunk. */}
          <div className="min-w-0 rounded-xl bg-[#007AFF] px-4 py-3.5 text-white">
            <p className="text-[12px] font-medium text-white">{step >= SUMMARY ? `Who buys from ${ex.domain}` : 'Building the buyer profile'}</p>
            <div className="mt-1.5 min-h-[2.75rem]">
              {step >= SUMMARY ? (
                <p className="fl-rise text-[15px] font-semibold leading-snug tracking-[-0.01em]">{ex.summary}</p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <span className="fl-sheen block h-3.5 w-[92%] rounded" />
                  <span className="fl-sheen block h-3.5 w-[64%] rounded" />
                </div>
              )}
            </div>
            <dl className="mt-3 space-y-2 border-t border-white/20 pt-3">
              {ex.rows.map(([label, values], i) => (
                <div key={label} className="flex h-6 items-center gap-3">
                  <dt className="w-[3.75rem] shrink-0 text-[12px] text-white sm:w-[5.5rem]">{label}</dt>
                  <dd className="flex min-w-0 gap-1.5 overflow-hidden max-sm:[&>*:nth-child(n+3)]:hidden">
                    {step >= FIRST_ROW + i
                      ? values.map((v, j) => (
                          <span
                            key={v}
                            className="fl-rise shrink-0 rounded-md bg-white px-2 py-0.5 text-[12px] font-medium text-[#0c1f45]"
                            style={{ animationDelay: `${j * 70}ms` }}
                          >
                            {v}
                          </span>
                        ))
                      : [0, 1].map((j) => <span key={j} className="fl-sheen h-5 w-16 shrink-0 rounded-md" />)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="border-t border-[#eef1f5] px-4 pb-2 pt-3.5 sm:px-5">
          <div className="flex h-7 items-baseline justify-between gap-3">
            <p className="text-[13px] font-semibold text-[#111827]">Your 25, first 3 shown</p>
            <p className="text-[13px] text-[#4b5563]">
              {step >= COUNT ? (
                <>
                  from{' '}
                  <AnimatedNumber key={`${run}-${index}`} value={ex.count} from={still ? undefined : 0} duration={900} className="inline-block w-[2.5rem] text-left font-semibold tabular-nums text-[#007AFF]" />{' '}
                  who fit
                </>
              ) : (
                ''
              )}
            </p>
          </div>
          <ul className="mt-1">
            {ex.leads.map(([name, title, company, email, why], i) => (
              <li key={name} className={`grid h-[4.25rem] content-center gap-0.5 border-b border-[#f1f3f6] last:border-b-0 max-sm:[&:nth-child(3)]:hidden ${step >= FIRST_LEAD + i ? 'fl-land' : ''}`}>
                {step >= FIRST_LEAD + i ? (
                  <>
                    <div className="flex min-w-0 items-baseline gap-2 text-[13px]">
                      <span className="shrink-0 font-semibold text-[#111827]">{name}</span>
                      <span className="min-w-0 truncate text-[#4b5563]">
                        {title}, {company}
                      </span>
                      <span className="ml-auto hidden shrink-0 text-[12px] text-[#374151] sm:inline">{email}</span>
                    </div>
                    <p className="truncate text-[12.5px] text-[#374151]">
                      <span className="mr-1.5 font-semibold text-[#0066DD]">Why them</span>
                      {why}
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <span className="fl-sheen-ink block h-3 w-1/2 rounded" />
                    <span className="fl-sheen-ink block h-3 w-4/5 rounded" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="sr-only">
        For {ex.domain}, we read {ex.pages.length} pages, describe its buyers as: {ex.summary} Then {ex.count} people match, and
        each lead comes with a name, title, company, work email and a reason they fit.
      </p>
    </figure>
  )
}
