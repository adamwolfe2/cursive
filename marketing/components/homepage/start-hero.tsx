"use client"

import { ArrowRight, Check, Globe } from "lucide-react"
import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { Container } from "@/components/ui/container"
import { START_URL, startUrl } from "@/lib/cta"
import { trackCTAClick } from "@/lib/analytics"
import { HeroField } from "./hero-field"
import { StartHeroDemo } from "./start-hero-demo"
import { Stage } from "./stage"
import { H2 } from "./type"
import "./start-hero.css"

/*
 * Same hero as the app's front door (leads.meetcursive.com/start, src/app/start/_components/Hero.tsx): same words,
 * same field, same example scan. Submitting hands the site to /start?site=..., which starts the scan on load.
 * Copy changes here must land there too.
 */

const NOT_A_SITE = "That doesn't look like a website. Try something like acme.com."
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"

/**
 * Mirrors normalizeUrl in src/app/start/_components/StartFlow.tsx so a bad site is caught here, not after the hop.
 * acme.com, https://www.acme.com/about?x=1#top -> "acme.com" / "www.acme.com/about"; null if it can't be a site.
 */
export function normalizeSite(raw: string): string | null {
  const v = raw.trim()
  if (!v || /\s/.test(v)) return null
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`
  if (!URL.canParse(candidate)) return null
  const url = new URL(candidate)
  if (!/^([a-z0-9-]+\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(url.hostname)) return null
  return url.hostname + url.pathname.replace(/\/+$/, "")
}

/** The website field and button, shared by the hero and the closing call to action. */
export function SiteForm({ placement, className = "" }: { placement: string; className?: string }) {
  const id = useId()
  const errId = useId()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const site = normalizeSite(value)
    if (!site) {
      setError(NOT_A_SITE)
      e.currentTarget.querySelector("input")?.focus()
      return
    }
    setError(null)
    trackCTAClick("Get my 25 leads", placement)
    window.location.assign(startUrl(placement, site))
  }

  // A plain GET form, so a submit before hydration still lands on /start with the site and tags.
  return (
    <form action={START_URL} method="get" onSubmit={submit} noValidate className={`w-full max-w-[36rem] ${className}`}>
      <label htmlFor={id} className="sr-only">
        Your website
      </label>
      <div className="flex flex-col gap-2 rounded-2xl border border-[#d6e4f7] bg-white p-2 shadow-[0_18px_40px_-24px_rgb(15_23_42/0.35)] transition-[border-color,box-shadow] focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/15 sm:flex-row sm:items-center sm:pl-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-2 sm:px-0">
          <Globe className="h-5 w-5 shrink-0 text-[#94a3b8]" aria-hidden="true" />
          <input
            id={id}
            name="site"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={2048}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
            placeholder="yourcompany.com"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
            className="h-12 min-w-0 flex-1 bg-transparent text-left text-[17px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
          />
        </div>
        <input type="hidden" name="utm_source" value="meetcursive" />
        <input type="hidden" name="utm_medium" value="website" />
        <input type="hidden" name="utm_content" value={placement} />
        <button
          type="submit"
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-6 text-[16px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0066DD] active:scale-[0.98] ${FOCUS}`}
        >
          Get my 25 leads
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p id={errId} role="alert" className="mt-2 min-h-5 text-sm text-[#b91c1c]">
        {error}
      </p>
    </form>
  )
}

export function StartHero() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="px-2 pt-2 sm:px-4 sm:pt-3">
      <Stage>
        <HeroField />
        <Container className="flex flex-col items-center py-16 text-center sm:py-28">
          <h1 id="hero-heading" className="max-w-[18ch] text-[2.375rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0f172a] sm:text-[3.5rem] lg:text-[4rem]">
            Find the 25 people most likely to buy from you
          </h1>
          <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-[#475569] sm:text-[19px]">
            Paste your website. We work out who buys from you and send 25 decision makers, each with a checked work email and why they fit. Want them contacted? We run the outreach too.
          </p>

          <SiteForm placement="home-hero-input" className="mt-9" />

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] text-[#475569]">
            {["Free, no card", "No sales call", "Checked work emails"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#007AFF]" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <a
            href={startUrl("home-hero-describe")}
            className={`mt-6 inline-flex min-h-11 items-center rounded-md px-1 text-[14px] font-medium text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF] ${FOCUS}`}
          >
            No website? Describe what you sell
          </a>
        </Container>
      </Stage>
    </section>
  )
}

/** The sample scan, framed like every other product moment on the page. It waits until it is on screen, so
 * visitors see the scan from its first step instead of mid-cycle. */
export function StartExample() {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setSeen(true)
        io.disconnect()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="example" aria-labelledby="example-heading" className="scroll-mt-20 px-2 py-20 sm:px-4 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 id="example-heading" className={H2}>
          Watch a scan, start to finish
        </h2>
        <p className="mt-3 text-balance text-[17px] leading-relaxed text-[#475569]">
          Example scans of well-known companies, not our customers. Yours runs the same way on your site.
        </p>
      </div>
      <Stage className="mx-auto mt-12 max-w-7xl">
        <div className="mx-auto max-w-3xl px-3 py-10 sm:px-8 sm:py-16">
          <div ref={ref} className="rounded-[26px] bg-white p-3 border border-[#e3eeff] shadow-[0_24px_50px_-30px_rgb(15_23_42/0.35)] sm:p-4">
            <StartHeroDemo held={!seen} />
          </div>
          <p className="mx-auto mt-4 max-w-[62ch] text-center text-[13px] leading-relaxed text-[#64748b]">
            Counts are real matches in our database on October 1, 2026. Lead names are illustrative and portraits are AI-generated.
          </p>
          <div className="mt-8 text-center">
            <a href={startUrl("home-example")} className={`inline-flex h-11 items-center gap-2 rounded-xl bg-[#007AFF] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0066DD] ${FOCUS}`}>
              Get my 25 leads
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </Stage>
    </section>
  )
}
