'use client'

import { Check, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/*
 * Ported from the app's /start hero (src/app/start/_components/HeroDemo.tsx): the marketing site is a separate
 * Next app, so the demo, its page row and number tween are copied here. Keep the two in step when either changes.
 */

type PageRow = { path: string; state: 'fetching' | 'read'; chars: number }

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

export function StartHeroDemo({ held }: { held: boolean }) {
  const [index, setIndex] = useState(0)
  const [rawStep, setStep] = useState(0)
  /** Bumped whenever an example (re)starts, so its progress bar and entrance motion restart too. */
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  /** Reduced motion: a still, finished example. False on the server, so the first paint matches. */
  const still = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false)
  const step = still ? LAST : rawStep

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
    setStep(0)
    setRun((r) => r + 1)
  }

  const ex = EXAMPLES[index]
  const pages: PageRow[] = ex.pages.slice(0, Math.min(step, 3)).map(([path, chars], i) => ({
    path,
    state: i < step - 1 ? 'read' : 'fetching',
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
        <div role="group" aria-label="Pick an example" className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,black_80%,transparent)]">
          {EXAMPLES.map((e, i) => (
            <button
              key={e.domain}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={i === index}
              className={`relative min-h-11 shrink-0 overflow-hidden rounded-full px-4 text-[13px] font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] ${
                i === index ? 'bg-[#007AFF] text-white' : 'text-[#4b5563] hover:bg-[#eef4fc] hover:text-[#111827]'
              }`}
            >
              {e.tab}
              {i === index && !still && (
                <span
                  key={run}
                  aria-hidden="true"
                  className="fl-fill absolute inset-x-4 bottom-1.5 h-px bg-white/60"
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef4fc] hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
          >
            {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div
        key={run}
        aria-hidden="true"
        className="mt-3 overflow-hidden rounded-[22px] border border-[#e3e9f2] bg-white shadow-[0_1px_0_rgb(255_255_255)_inset,0_30px_70px_-34px_rgb(12_31_69/0.35),0_2px_6px_-2px_rgb(12_31_69/0.06)]"
      >
        {/* The site being read: its address types in, then the agent says what it is doing. */}
        <div className="flex h-14 items-center gap-3 border-b border-[#eef1f5] px-5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#e5e7eb] text-[12px] font-semibold uppercase text-[#0f172a]">
            {ex.domain[0]}
          </span>
          <span className="relative min-w-0 flex-1 truncate text-[14px] font-semibold text-[#111827]">
            <span className={still ? '' : 'fl-type inline-block'}>{ex.domain}</span>
          </span>
          {/* Fixed width, so the label changing never moves anything. */}
          <span className="w-24 shrink-0 text-right text-[12px] text-[#6b7280] sm:w-28">
            {step >= COUNT ? 'Done' : readAll ? 'Finding buyers' : step > 0 ? 'Reading pages' : ''}
          </span>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] max-sm:hidden">Example</span>
        </div>

        <div className="px-5 pt-4">
          <ul className="grid h-[5.25rem] content-start gap-x-4 gap-y-1 sm:h-6 sm:grid-cols-3">
            {pages.map((p) => (
              <PageLine key={p.path} page={p} />
            ))}
          </ul>
        </div>

        {/* The agent's answer: the Cursive mark, then who buys, written out word by word. */}
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-center gap-2.5">
            <AgentOrb size={26} working={step > 0 && step < COUNT} />
            <p className="text-[12.5px] font-medium text-[#4b5563]">
              {step >= SUMMARY ? `Who buys from ${ex.domain}` : step > 0 ? 'Working out who buys' : 'Cursive'}
            </p>
          </div>
          <div className="mt-2 min-h-[2.75rem]">
            {step >= SUMMARY ? (
              <p className="text-[19px] font-light leading-[1.3] tracking-[-0.015em] text-[#0f172a]">
                {still ? ex.summary : <Words text={ex.summary} />}
              </p>
            ) : (
              <div className="space-y-2 pt-1.5">
                <span className="fl-sheen-ink block h-3.5 w-[88%] rounded-full" />
                <span className="fl-sheen-ink block h-3.5 w-[56%] rounded-full" />
              </div>
            )}
          </div>
          <dl className="mt-3 space-y-1.5">
            {ex.rows.map(([label, values], i) => (
              <div key={label} className="flex h-7 items-center gap-3">
                <dt className="w-[3.75rem] shrink-0 text-[12px] text-[#6b7280] sm:w-[4.5rem]">{label}</dt>
                <dd className="flex min-w-0 gap-1.5 overflow-hidden max-sm:[&>*:nth-child(n+3)]:hidden">
                  {step >= FIRST_ROW + i
                    ? values.map((v, j) => (
                        <span
                          key={v}
                          className="fl-rise shrink-0 rounded-full border border-[#d6e6ff] bg-[#f3f8ff] px-2.5 py-0.5 text-[12px] font-medium text-[#0f172a]"
                          style={{ animationDelay: `${j * 70}ms` }}
                        >
                          {v}
                        </span>
                      ))
                    : [0, 1].map((j) => <span key={j} className="fl-sheen-ink h-6 w-16 shrink-0 rounded-full" />)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-[#eef1f5] bg-[#fbfcfe] px-5 pb-2 pt-4">
          <div className="flex h-9 items-baseline gap-2">
            {step >= COUNT ? (
              <>
                <AnimatedNumber
                  key={`${run}-${index}`}
                  value={ex.count}
                  from={still ? undefined : 0}
                  duration={900}
                  className="text-[28px] font-light leading-none tabular-nums tracking-[-0.02em] text-[#007AFF]"
                />
                <span className="text-[13px] text-[#4b5563]">people fit. Your first 3 of 25:</span>
              </>
            ) : (
              <span className="text-[13px] text-[#9ca3af]">{readAll ? 'Counting people who fit' : ''}</span>
            )}
          </div>
          <ul className="mt-1">
            {ex.leads.map(([name, title, company, email, why], i) => (
              <li key={name} className={`-mx-2 grid h-[4.25rem] content-center rounded-xl px-2 max-sm:[&:nth-child(3)]:hidden ${step >= FIRST_LEAD + i ? 'fl-land' : ''}`}>
                {/* Keyed wrappers: the row is replaced, not patched, so the placeholder never counts as a layout shift. */}
                {step >= FIRST_LEAD + i ? (
                  <div key="lead" className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f1ff] text-[13px] font-semibold text-[#0066DD]">{name[0]}</span>
                    <div className="grid min-w-0 gap-0.5">
                      <div className="flex min-w-0 items-baseline gap-2 text-[13px]">
                        <span className="shrink-0 font-semibold text-[#111827]">{name}</span>
                        <span className="min-w-0 truncate text-[#4b5563]">
                          {title}, {company}
                        </span>
                        <span className="ml-auto hidden shrink-0 text-[12px] text-[#6b7280] sm:inline">{email}</span>
                      </div>
                      <p className="truncate text-[12.5px] text-[#374151]">{why}</p>
                    </div>
                  </div>
                ) : (
                  <div key="placeholder" className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3">
                    <span className="fl-sheen-ink h-9 w-9 rounded-full" />
                    <span className="space-y-2">
                      <span className="fl-sheen-ink block h-2.5 w-2/5 rounded-full" />
                      <span className="fl-sheen-ink block h-2.5 w-3/4 rounded-full" />
                    </span>
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

/** The Cursive mark as the agent: drifts gently, and a halo breathes behind it while it works. */
function AgentOrb({ size, working }: { size: number; working: boolean }) {
  return (
    <span className="fl-orb relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} data-working={working || undefined} aria-hidden="true">
      <span className="fl-halo absolute -inset-[45%] rounded-full" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static mark, already loaded by the header */}
      <img src="/cursive-logo.png" alt="" width={size} height={size} className="fl-float relative h-full w-full object-contain" />
    </span>
  )
}

/** Writes a sentence out word by word. The whole sentence holds its space from the first frame. */
function Words({ text, step = 42 }: { text: string; step?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="fl-word" style={{ animationDelay: `${i * step}ms` }}>
            {w}
          </span>{' '}
        </span>
      ))}
    </>
  )
}

const REDUCED = '(prefers-reduced-motion: reduce)'
const prefersReducedMotion = () => window.matchMedia(REDUCED).matches
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const compactChars = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`)

function PageLine({ page }: { page: PageRow }) {
  return (
    <li className="fl-rise grid h-6 grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 text-[13px]">
      {page.state === 'fetching' ? (
        <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#b3d7ff] border-t-[#007AFF]" aria-hidden="true" />
      ) : (
        <Check className="h-3.5 w-3.5 text-[#007AFF]" aria-hidden="true" />
      )}
      <span className="truncate text-[#111827]">{page.path === '/' ? 'Homepage' : page.path}</span>
      <span className="text-[12px] tabular-nums text-[#6b7280]">
        {page.state === 'fetching' ? 'reading' : `${compactChars(page.chars)} chars`}
      </span>
    </li>
  )
}

const fmt = new Intl.NumberFormat('en-US')

/** Expo ease-out count from `from` to `value`. Visual only (aria-hidden); the figure's sr-only text carries it. */
function AnimatedNumber({ value, className, from, duration = 700 }: { value: number; className?: string; from?: number; duration?: number }) {
  const [shown, setShown] = useState(from ?? value)
  const current = useRef(from ?? value)

  useEffect(() => {
    const start = current.current
    let raf = 0
    if (start === value || prefersReducedMotion()) {
      current.current = value
      raf = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(raf)
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const v = Math.round(start + (value - start) * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)))
      current.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className={className} aria-hidden="true">
      {fmt.format(shown)}
    </span>
  )
}
