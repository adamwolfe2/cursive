"use client"

import { ArrowRight, Check } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { BOOKING_URL, startUrl } from "@/lib/cta"
import { DemoFind, DemoReach, DemoRun } from "./rung-demos"
import { Stage } from "./stage"
import "./ladder.css"

/*
 * The homepage below the example scan: the database moment, the three rungs (find, reach, run), the "recursive"
 * dictionary entry and pricing per rung. Pricing approved by Adam 2026-10-01 (.claude/specs/2026-10-01-cursive-pivot.md).
 * Contact total: 478,143,699 named contacts in GetLeads on 2026-10-01, so "400M+" is a floor, not a guess.
 */

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
import { H2, LEAD } from "./type"

function PrimaryLink({ href, placement, children }: { href?: string; placement: string; children: ReactNode }) {
  return (
    <a
      href={href ?? startUrl(placement)}
      className={`inline-flex h-11 items-center gap-2 rounded-xl bg-[#007AFF] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0066DD] ${FOCUS}`}
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  )
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-11 items-center gap-2 rounded-xl border border-[#d6e4f7] bg-white px-5 text-[15px] font-semibold text-[#0f172a] transition-colors hover:border-[#007AFF] ${FOCUS}`}
    >
      {children}
    </a>
  )
}

/* ---------- The database: 400M+ ---------- */

/** Counts 0 -> 400 (expo ease-out) the first time it scrolls into view. Static under reduced motion. */
function useCountOnView(to: number, ms = 1400) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(to)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / ms)
          setN(Math.round(to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    // Hidden until it counts; the server render and no-JS keep the real number.
    raf = requestAnimationFrame(() => setN(0))
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, ms])
  return { ref, n }
}

export function DatabaseSection() {
  const { ref, n } = useCountOnView(400)
  return (
    <section aria-labelledby="db-heading" className="px-6 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-end gap-6 xl:grid-cols-[auto_minmax(0,1fr)] xl:gap-16">
        <p
          className="whitespace-nowrap text-[clamp(5.5rem,22vw,15rem)] font-semibold leading-[0.85] tracking-[-0.06em] text-[#007AFF] tabular-nums xl:text-[12rem]"
          aria-hidden="true"
        >
          {/* The final number holds the width, so counting up never reflows the text beside it. */}
          <span className="relative inline-block">
            <span className="invisible">400</span>
            <span ref={ref} className="absolute inset-0 text-left">
              {n}
            </span>
          </span>
          M+
        </p>
        <div className="max-w-xl xl:pb-6">
          <h2 id="db-heading" className={H2}>
            <span className="sr-only">400 million plus </span>
            business contacts behind every list
          </h2>
          <p className={`mt-4 max-w-[46ch] ${LEAD}`}>
            Multi-sourced and enriched across several databases, so the people we pick for you come with a current
            title, company and a work email checked before it reaches you.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- The three rungs ---------- */

const RUNGS: Array<{
  id: string
  n: string
  kicker: string
  title: string
  body: string
  points: string[]
  demo: ReactNode
  cta: ReactNode
}> = [
  {
    id: "find",
    n: "1",
    kicker: "Find them",
    title: "Leads that get closer to your buyer every batch",
    body: "Start with 25 free from your website. Like the good ones, skip the rest and add your past customers. Cursive learns from all three and tunes the next batch.",
    points: ["25 free, no card", "Thumbs up or down on every lead", "Upload past customers to sharpen the match", "Then 25 fresh every Monday on Starter"],
    demo: <DemoFind />,
    cta: <PrimaryLink placement="home-rung-find">Get my 25 leads</PrimaryLink>,
  },
  {
    id: "reach",
    n: "2",
    kicker: "Reach them",
    title: "We run the outreach. You take the meetings.",
    body: "LinkedIn, email or both, sent to the same list you already shaped. We write the copy, run the sequences inside each platform’s limits and hand you the replies.",
    points: ["One LinkedIn sender profile, about 400 requests a month", "Email domain and inboxes on the combined plan", "From $1,497 a month, month‑to‑month"],
    demo: <DemoReach />,
    cta: <SecondaryLink href={BOOKING_URL}>Book a call about outreach</SecondaryLink>,
  },
  {
    id: "run",
    n: "3",
    kicker: "Run it",
    title: "One dashboard for your whole pipeline",
    body: "We build your company a dashboard that ties together leads, replies, site visitors, your site chat, your CRM and any API you use. Built for you, hosted and kept up by us.",
    points: ["Leads, outreach and site visitors in one place", "Connects your CRM and tools", "From $2,500 setup, then $500 a month"],
    demo: <DemoRun />,
    cta: <SecondaryLink href={BOOKING_URL}>Book a call about a dashboard</SecondaryLink>,
  },
]

export function RungsSection() {
  return (
    <section id="how" aria-labelledby="rungs-heading" className="scroll-mt-20 px-2 pb-8 sm:px-4">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 id="rungs-heading" className={H2}>
          Find them. Reach them. Run it.
        </h2>
        <p className={`mt-4 text-balance ${LEAD}`}>
          Cursive finds your buyers, reaches them for you, and gives you the system to run it. Start with the free 25;
          climb when you’re ready.
        </p>
      </div>
      <ol className="mx-auto mt-14 max-w-7xl space-y-6 sm:mt-20 sm:space-y-10">
        {RUNGS.map((r, i) => (
          <li key={r.id} id={`rung-${r.id}`}>
            <Stage>
              <div className="grid grid-cols-1 items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-16">
                <div className={`min-w-0 ${i % 2 ? "lg:order-2" : ""}`}>
                  <p className="flex items-center gap-3 text-[15px] font-semibold text-[#0066DD]">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#007AFF] text-[14px] text-white">{r.n}</span>
                    {r.kicker}
                  </p>
                  <h3 className="mt-5 max-w-[22ch] text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] text-[#0f172a] sm:text-[2.25rem]">
                    {r.title}
                  </h3>
                  <p className={`mt-4 max-w-[48ch] ${LEAD}`}>{r.body}</p>
                  <ul className="mt-6 space-y-2.5">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[15px] text-[#334155]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#007AFF]" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">{r.cta}</div>
                </div>
                <div className={`w-full min-w-0 max-w-[34rem] lg:mx-auto ${i % 2 ? "lg:order-1" : ""}`}>{r.demo}</div>
              </div>
            </Stage>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ---------- "recursive": the dictionary entry that fills as you scroll ---------- */

const SENSES: string[] = [
  "Repeating a process where each pass starts from the result of the last one.",
  "Of a lead list: getting closer to your ideal buyer with every batch, because each like, each skip and each past customer you add shapes the next 25.",
]

/** Splits a sense into words that fill one after another; --t is each word's place in the whole entry (0..1). */
function FillWords({ text, from, total }: { text: string; from: number; total: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="dict-word" style={{ ["--t" as string]: ((from + i) / total).toFixed(3) }}>
          {w}{" "}
        </span>
      ))}
    </>
  )
}

export function RecursiveSection() {
  const ref = useRef<HTMLElement>(null)

  // Fallback for browsers without scroll-driven animations: write --p from scroll position.
  useEffect(() => {
    const el = ref.current
    if (!el || CSS.supports("animation-timeline: view()")) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const span = r.height - window.innerHeight
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1
      el.style.setProperty("--p", p.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  const words = SENSES.map((s) => s.split(" ").length)
  const total = words.reduce((a, b) => a + b, 0)
  const starts = words.map((_, i) => words.slice(0, i).reduce((a, b) => a + b, 0))

  return (
    <section ref={ref} aria-labelledby="dict-heading" className="dict px-6">
      <div className="dict-pin mx-auto flex max-w-6xl flex-col justify-center">
        <p className="text-[15px] font-medium text-[#64748b]">Why we are called Cursive</p>
        <h2 id="dict-heading" className="mt-6 text-[clamp(3.25rem,10vw,7rem)] font-semibold leading-none tracking-[-0.045em] text-[#0f172a]">
          re<span className="text-[#007AFF]">cursive</span>
        </h2>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[18px] text-[#475569]">
          <span>re·cur·sive</span>
          <span className="text-[#64748b]">/rɪˈkɜr.sɪv/</span>
          <span className="font-medium italic text-[#0f172a]">adjective</span>
        </p>
        <ol className="mt-10 max-w-4xl space-y-6">
          {SENSES.map((s, i) => (
            <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 sm:grid-cols-[2.75rem_1fr]">
              <span className="pt-1 text-[18px] font-medium tabular-nums text-[#0066DD] sm:text-[22px]">{i + 1}.</span>
              <p className="text-[1.375rem] font-medium leading-[1.35] tracking-[-0.015em] sm:text-[2rem]">
                <FillWords text={s} from={starts[i]} total={total} />
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-[17px] text-[#475569]">
          See also: <span className="font-semibold text-[#0f172a]">Cursive</span>, the lead list that learns.
        </p>
        <div className="mt-8">
          <PrimaryLink placement="home-recursive">Get my 25 leads</PrimaryLink>
        </div>
      </div>
    </section>
  )
}

/* ---------- Pricing: one column per rung ---------- */

type Line = { name: string; price: string; unit?: string; note: string; tag?: string }

const PRICING: Array<{ n: string; rung: string; lead: string; lines: Line[]; cta: ReactNode }> = [
  {
    n: "1",
    rung: "Find them",
    lead: "Leads to your exact buyer, as credits or every week.",
    lines: [
      { name: "Free", price: "$0", note: "25 leads from your website, no card" },
      { name: "Credits", price: "$49", unit: "100 leads", note: "500 for $199 · 2,000 for $599 · unused credits roll over", tag: "Early access" },
      { name: "Starter", price: "$197", unit: "/mo", note: "25 fresh leads every Monday (about 100 a month), picked and checked for you.", tag: "14‑day free trial" },
      { name: "Growth", price: "$497", unit: "/mo", note: "500 leads a month, tuned by your likes and customer list", tag: "Early access" },
    ],
    cta: <PrimaryLink placement="home-pricing-find">Get my 25 leads</PrimaryLink>,
  },
  {
    n: "2",
    rung: "Reach them",
    lead: "Done-for-you outreach to the list you shaped. Growth leads included.",
    lines: [
      { name: "LinkedIn", price: "$1,497", unit: "/mo", note: "One sender profile, about 400 connection requests a month, copy written and run by us" },
      { name: "LinkedIn + email", price: "$2,497", unit: "/mo", note: "Everything in LinkedIn, plus an email domain and inboxes" },
    ],
    cta: <SecondaryLink href={BOOKING_URL}>Book a call</SecondaryLink>,
  },
  {
    n: "3",
    rung: "Run it",
    lead: "Your own dashboard for leads, outreach, visitors, chat and CRM.",
    lines: [
      { name: "Operating system", price: "$2,500+", unit: "setup", note: "Built around how you sell, then $500 a month to host and maintain" },
      { name: "Visitor Pixel", price: "$97", unit: "/mo", note: "Add-on at any step: see which companies visit your site" },
    ],
    cta: <SecondaryLink href={BOOKING_URL}>Book a call</SecondaryLink>,
  },
]

/** The three pricing columns, shared by the homepage and /pricing. */
export function PricingGrid({ className = "" }: { className?: string }) {
  return (
      <div className={`mx-auto grid max-w-2xl gap-px overflow-hidden lg:max-w-6xl rounded-[28px] border border-[#e3eeff] bg-[#e3eeff] lg:grid-cols-3 ${className}`}>
        {PRICING.map((col) => (
          <div key={col.rung} className="flex flex-col bg-white p-6 sm:p-8">
            <p className="flex items-center gap-2.5 text-[15px] font-semibold text-[#0066DD]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#007AFF] text-[13px] text-white">{col.n}</span>
              {col.rung}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#475569]">{col.lead}</p>
            <dl className="mt-6 flex-1 divide-y divide-[#eef1f5] border-t border-[#eef1f5]">
              {col.lines.map((l) => (
                <div key={l.name} className="py-4">
                  <dt className="flex items-baseline justify-between gap-3 lg:flex-col lg:gap-1 xl:flex-row xl:gap-3">
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-[#0f172a]">
                      {l.name}
                      {l.tag && (
                        <span className="rounded-full bg-[#eef5ff] px-2 py-0.5 text-[11px] font-semibold text-[#0066DD]">{l.tag}</span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums text-[#0f172a]">
                      <span className="text-[22px] font-semibold tracking-[-0.02em]">{l.price}</span>
                      {l.unit && <span className="ml-1 text-[13px] text-[#64748b]">{l.unit}</span>}
                    </span>
                  </dt>
                  <dd className="mt-1 text-[13.5px] leading-relaxed text-[#64748b]">{l.note}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">{col.cta}</div>
          </div>
        ))}
      </div>
  )
}

export function LadderPricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-20 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="pricing-heading" className={H2}>
          Start free. Add outreach or a dashboard when you’re ready.
        </h2>
        <p className={`mt-4 ${LEAD}`}>Month‑to‑month on every plan. No long contract.</p>
      </div>
      <PricingGrid className="mt-14" />
    </section>
  )
}
