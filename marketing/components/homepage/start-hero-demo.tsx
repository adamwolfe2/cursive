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
  name: string
  domain: string
  logo: string
  pages: Array<[path: string, chars: number]>
  summary: string
  rows: Array<[label: string, values: string[]]>
  /** Real count of matching contacts for these filters (GetLeads, 2026-10-01). */
  count: number
  /** Illustrative people: names and companies are made up, emails masked. */
  leads: Array<[name: string, title: string, company: string, email: string, why: string]>
}

/** Example scans of well-known companies' public sites. None of them are Cursive customers. */
const EXAMPLES: Example[] = [
  {
    name: 'Linear',
    domain: 'linear.app',
    logo: '/logos/linear.svg',
    pages: [['/', 11_802], ['/pricing', 3_406], ['/customers', 6_115]],
    summary: 'Software companies of 51 to 500 people whose engineering teams have outgrown their issue tracker.',
    rows: [
      ['Titles', ['CTO', 'VP of Engineering', 'Head of Engineering']],
      ['Size', ['51–200 people', '201–500 people']],
      ['Where', ['United States']],
    ],
    count: 4449,
    leads: [
      ['Rachel J.', 'VP of Engineering', 'Ledgerline', 'r•••@ledgerline.com', 'Grew her team from 30 to 90 engineers in a year; planning runs on spreadsheets.'],
      ['Marcus O.', 'CTO', 'Shipfast', 'm•••@shipfast.dev', 'Series A dev-tools company splitting into its first product squads.'],
      ['Priya R.', 'Head of Engineering', 'Northwind Health', 'p•••@northwindhealth.io', 'Runs four teams shipping weekly to hospital customers.'],
    ],
  },
  {
    name: 'HubSpot',
    domain: 'hubspot.com',
    logo: '/logos/hubspot.svg',
    pages: [['/', 14_230], ['/pricing', 7_918], ['/products/marketing', 9_064]],
    summary: 'B2B software and IT services firms of 11 to 200 people where one marketing leader owns the whole funnel.',
    rows: [
      ['Titles', ['VP of Marketing', 'Head of Marketing', 'Marketing Director']],
      ['Industry', ['Software', 'IT services']],
      ['Size', ['11–50 people', '51–200 people']],
    ],
    count: 3445,
    leads: [
      ['Dana W.', 'Head of Marketing', 'Stackpoint', 'd•••@stackpoint.io', 'First marketing hire at a 60-person SaaS company, still on spreadsheets.'],
      ['Leo K.', 'VP of Marketing', 'Brightwire IT', 'l•••@brightwireit.com', 'Owns demand gen and the website for a managed services firm.'],
      ['Aisha B.', 'Marketing Director', 'Quotely', 'a•••@quotely.com', 'Just hired two SDRs and needs leads routed to them.'],
    ],
  },
  {
    name: 'Shopify',
    domain: 'shopify.com',
    logo: '/logos/shopify.svg',
    pages: [['/', 10_377], ['/pricing', 5_214], ['/start', 2_958]],
    summary: 'Independent apparel and beauty brands under 50 people, still run day to day by the founder.',
    rows: [
      ['Titles', ['Founder', 'Owner', 'Head of Ecommerce']],
      ['Industry', ['Apparel', 'Personal care']],
      ['Size', ['1–10 people', '11–50 people']],
    ],
    count: 14300,
    leads: [
      ['Hannah K.', 'Founder', 'Saltwater Goods', 'h•••@saltwatergoods.co', 'Sells swimwear wholesale and wants her own online store.'],
      ['Tomas R.', 'Head of Ecommerce', 'Kindred Skin', 't•••@kindredskin.com', 'Moving a skincare line off a marketplace and onto its own site.'],
      ['Ravi S.', 'Owner', 'Thread & Pine', 'r•••@threadandpine.com', 'Opened a second shop this spring and needs one place to sell.'],
    ],
  },
  {
    name: 'Webflow',
    domain: 'webflow.com',
    logo: '/logos/webflow.svg',
    pages: [['/', 12_408], ['/pricing', 4_221], ['/enterprise', 5_870]],
    summary: 'Design, ad and marketing agencies under 50 people that build websites for their clients.',
    rows: [
      ['Titles', ['Creative Director', 'Founder', 'Head of Design']],
      ['Industry', ['Design', 'Advertising', 'Marketing']],
      ['Size', ['1–10 people', '11–50 people']],
    ],
    count: 44639,
    leads: [
      ['Greg M.', 'Creative Director', 'Fieldnote Studio', 'g•••@fieldnote.studio', 'Twelve-person studio that hands every site build to a contractor.'],
      ['Nadia F.', 'Founder', 'Northpaw Creative', 'n•••@northpaw.co', 'Agency of eight that just signed three website retainers.'],
      ['Owen P.', 'Head of Design', 'Loudmouth Ads', 'o•••@loudmouthads.com', 'Wants clients editing their own pages without a developer.'],
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
      aria-label={`Example scan of ${ex.domain} (${ex.name} is not a Cursive customer) and the buyers it finds`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="flex flex-wrap items-center gap-x-2">
        <p className="min-w-0 flex-1 truncate text-[13px] text-[#4b5563] max-sm:order-last max-sm:basis-full max-sm:pt-1 max-sm:text-center">
          Example scan of <span className="font-semibold text-[#111827]">{ex.domain}</span> · not a customer
        </p>
        <div role="group" aria-label="Pick an example" className="flex shrink-0 items-center max-sm:mx-auto sm:gap-1">
          {EXAMPLES.map((e, i) => (
            <button
              key={e.domain}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={i === index}
              aria-label={`Example scan of ${e.domain}`}
              className={`relative grid h-11 w-11 place-items-center overflow-hidden rounded-full transition-[background-color,opacity] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] ${
                i === index ? 'bg-white shadow-[0_0_0_1.5px_#007AFF]' : 'opacity-45 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo */}
              <img src={e.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              {i === index && !still && (
                <svg key={run} aria-hidden="true" viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                  <circle
                    cx="22"
                    cy="22"
                    r="20.5"
                    fill="none"
                    stroke="#007AFF"
                    strokeWidth="1.5"
                    pathLength={1}
                    strokeDasharray="1"
                    className="fl-ring"
                    style={{ animationDuration: `${CYCLE_MS}ms`, animationPlayState: stopped ? 'paused' : 'running' }}
                  />
                </svg>
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
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#e5e7eb] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo */}
            <img src={ex.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
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
        Example scan of {ex.domain}: we read {ex.pages.length} pages and describe its buyers as: {ex.summary} Then {ex.count} people in
        our database match, and each lead comes with a name, title, company, work email and a reason they fit. Lead names shown are illustrative.
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
