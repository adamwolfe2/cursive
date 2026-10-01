"use client"

import { ArrowRight, Globe } from "lucide-react"
import { useId, useState, type FormEvent } from "react"
import { Container } from "@/components/ui/container"
import { BOOKING_URL, START_URL, startUrl } from "@/lib/cta"
import { trackCTAClick } from "@/lib/analytics"
import { StartHeroDemo } from "./start-hero-demo"
import { Stage } from "./stage"
import "./start-hero.css"

/*
 * Same hero as the app's front door (leads.meetcursive.com/start, src/app/start/_components/Hero.tsx): same words,
 * same field, same example scan. Submitting hands the site to /start?site=..., which starts the scan on load.
 * Copy changes here must land there too.
 */

const PLACEMENT = "home-hero-input"
const NOT_A_SITE = "That doesn't look like a website. Try something like acme.com."
const CHIP =
  "inline-flex min-h-10 items-center rounded-full bg-white/95 px-4 text-[13px] font-medium text-[#0c1f45] shadow-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

export function StartHero() {
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
    trackCTAClick("Find my buyers", PLACEMENT)
    window.location.assign(startUrl(PLACEMENT, site))
  }

  return (
    <section id="hero" aria-labelledby="hero-heading" className="px-2 pt-2 sm:px-4 sm:pt-3">
      <Stage>
        <Container className="flex min-h-[calc(100svh-5.5rem)] flex-col items-center justify-center py-20 text-center sm:py-24">
          <h1 id="hero-heading" className="text-[2.5rem] font-light leading-[1.05] tracking-[-0.025em] text-white sm:text-[3.5rem] lg:text-[4.25rem]">
            <span className="block sm:inline">Your site in.</span>{" "}
            <span className="fl-orb relative mx-2 inline-grid h-[0.9em] w-[0.9em] translate-y-[0.08em] place-items-center rounded-full bg-white align-baseline shadow-[0_8px_24px_-8px_rgb(4_22_66/0.6)] max-sm:hidden" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
              <img src="/cursive-logo.png" alt="" width={48} height={48} className="fl-float h-[70%] w-[70%] object-contain" />
            </span>{" "}
            <span className="font-cursive block text-[1.2em] leading-[1] sm:inline">25 buyers out.</span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-white/80 sm:text-lg">
            We read your site, work out who buys, and find 25 people who fit, with work emails. Free, about a minute.
          </p>

          {/* A plain GET form, so a submit before hydration still lands on /start with the site and tags. */}
          <form action={START_URL} method="get" onSubmit={submit} noValidate className="mt-9 w-full max-w-[40rem]">
            <label htmlFor={id} className="sr-only">
              Your website
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-2 pl-5 shadow-[0_24px_60px_-20px_rgb(4_22_66/0.6)] ring-1 ring-white/40 transition-shadow focus-within:ring-4 focus-within:ring-white/50">
              <Globe className="h-5 w-5 shrink-0 text-[#6b7280]" aria-hidden="true" />
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
                className="h-14 min-w-0 flex-1 bg-transparent text-left text-lg text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
              />
              <input type="hidden" name="utm_source" value="meetcursive" />
              <input type="hidden" name="utm_medium" value="website" />
              <input type="hidden" name="utm_content" value={PLACEMENT} />
              <button
                type="submit"
                className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-5 text-[16px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0066DD] active:scale-[0.98] ${FOCUS}`}
              >
                <span className="max-sm:sr-only">Find my buyers</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p id={errId} role="alert" className="mt-2 min-h-5 text-sm font-medium text-white">
              {error}
            </p>
          </form>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <a href={startUrl("home-hero-describe")} className={CHIP}>
              No website? Describe what you sell
            </a>
            <a href="#example" className={CHIP}>
              See an example
            </a>
            <a href={BOOKING_URL} className={CHIP}>
              Book a call
            </a>
          </div>

          <p className="mt-16 text-[13px] text-white/60">
            Free. No card, no sales call. Built on 280M verified profiles, refreshed every 30 days.
          </p>
        </Container>
      </Stage>
    </section>
  )
}

/** The sample scan, framed like every other product moment on the page. */
export function StartExample() {
  return (
    <section id="example" aria-labelledby="example-heading" className="scroll-mt-20 px-2 py-20 sm:px-4 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 id="example-heading" className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-[#0c1f45] sm:text-[2.5rem]">
          Watch it find your buyers
        </h2>
        <p className="mt-3 text-[17px] leading-relaxed text-[#4b5563]">
          A sample scan, start to finish. Yours runs the same way on your own site.
        </p>
        <a href={startUrl("home-example")} className={`mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#0c1f45] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#13306b] ${FOCUS}`}>
          Get 25 free leads
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
      <Stage className="mx-auto mt-12 max-w-7xl">
        <div className="mx-auto max-w-3xl px-3 py-10 sm:px-8 sm:py-16">
          <div className="rounded-[26px] bg-white p-3 shadow-[0_30px_70px_-30px_rgb(4_22_66/0.7)] sm:p-4">
            <StartHeroDemo held={false} />
          </div>
        </div>
      </Stage>
    </section>
  )
}
