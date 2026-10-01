"use client"

import { ArrowRight, Globe } from "lucide-react"
import { useId, useState, type FormEvent } from "react"
import { Container } from "@/components/ui/container"
import { START_URL, startUrl } from "@/lib/cta"
import { trackCTAClick } from "@/lib/analytics"
import { StartHeroDemo } from "./start-hero-demo"
import "./start-hero.css"

/*
 * Same hero as the app's front door (leads.meetcursive.com/start, src/app/start/_components/Hero.tsx): same words,
 * same field, same example scan. Submitting hands the site to /start?site=..., which starts the scan on load.
 * Copy changes here must land there too.
 */

const PLACEMENT = "home-hero-input"
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
    <section id="hero" aria-labelledby="hero-heading" className="bg-white">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,29rem)_minmax(0,1fr)] lg:items-start lg:gap-14 lg:pb-24 lg:pt-14">
        <div className="min-w-0">
          <span className="fl-orb relative mb-6 inline-grid h-11 w-11 place-items-center" data-working="" aria-hidden="true">
            <span className="fl-halo absolute -inset-[45%] rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
            <img src="/cursive-logo.png" alt="" width={44} height={44} className="fl-float relative h-11 w-11 object-contain" />
          </span>
          <h1
            id="hero-heading"
            className="text-[2.75rem] font-light leading-[1.02] tracking-[-0.02em] text-[#111827] sm:text-[4rem] lg:text-[4.25rem]"
          >
            Your site in.{' '}
            <span className="font-cursive fl-write mt-1 block pb-1 text-[3.5rem] leading-[1] text-[#007AFF] sm:text-[5rem] lg:text-[5.5rem]">25 buyers out.</span>
          </h1>
          <p className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-[#4b5563] sm:mt-6 sm:text-lg">
            We read your site, work out who buys, and find 25 people who fit, with work emails. Free, about a minute.
          </p>

          {/* A plain GET form, so a submit before hydration still lands on /start with the site and tags. */}
          <form action={START_URL} method="get" onSubmit={submit} noValidate className="mt-8 sm:mt-10">
            <label htmlFor={id} className="text-sm font-medium text-[#111827]">
              Your website
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-2xl sm:border sm:border-[#d1d5db] sm:bg-white sm:p-1.5 sm:pl-4 sm:shadow-[0_12px_32px_-18px_rgb(12_31_69/0.35)] sm:transition-shadow sm:focus-within:border-[#007AFF] sm:focus-within:ring-4 sm:focus-within:ring-[#007AFF]/15">
              <div className="flex h-14 shrink-0 items-center gap-3 rounded-xl border border-[#d1d5db] bg-white px-4 focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/15 sm:h-12 sm:flex-1 sm:rounded-none sm:border-0 sm:px-0 sm:focus-within:ring-0">
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
                  className="h-full min-w-0 flex-1 bg-transparent text-lg text-[#111827] placeholder:text-[#6b7280] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <input type="hidden" name="utm_source" value="meetcursive" />
              <input type="hidden" name="utm_medium" value="website" />
              <input type="hidden" name="utm_content" value={PLACEMENT} />
              <button
                type="submit"
                className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-6 text-[16px] font-semibold text-white shadow-[0_8px_20px_-8px_rgb(0_99_230/0.6)] transition-[background-color,transform] duration-150 hover:bg-[#0066DD] active:scale-[0.98] ${FOCUS}`}
              >
                Find my buyers
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p id={errId} role="alert" className="mt-2 min-h-5 text-sm text-[#b91c1c]">
              {error}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
              <a
                href={startUrl("home-hero-describe")}
                className={`-ml-1 inline-flex min-h-11 items-center rounded-md px-1 font-medium text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF] ${FOCUS}`}
              >
                No website? Describe what you sell
              </a>
              <p className="text-[#4b5563]">Free. No card, no sales call.</p>
            </div>
          </form>
        </div>

        <StartHeroDemo held={value.trim().length > 0} />
      </Container>
    </section>
  )
}
