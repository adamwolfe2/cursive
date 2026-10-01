/**
 * Pricing: free first, then self-serve plans, then done-for-you.
 *
 *   - 25 free leads at leads.meetcursive.com/start (no card, no call)
 *   - Visitor Pixel ($97/mo), Custom Audience ($197/mo), Bundle ($247/mo):
 *     plan buttons go to leads.meetcursive.com/get-leads (Stripe Checkout)
 *   - Weekly leads, LinkedIn outreach, custom AI dashboard: same ladder as
 *     the /start results page; priced on a call, so no prices shown here.
 *
 * Source of truth for prices: src/lib/stripe/funnel-products.ts (app repo).
 * URL is preserved (/pricing) so existing inbound links + SEO carry over.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"
import { GET_LEADS_URL, BOOKING_URL, DASHBOARD_EXAMPLES_URL, START_CTA_LABEL, startUrl } from "@/lib/cta"

export const metadata: Metadata = {
  title: "Pricing | Cursive",
  description:
    "Start with 25 free leads from your website, no card. Then Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo, month-to-month.",
  alternates: {
    canonical: "https://www.meetcursive.com/pricing",
  },
  openGraph: {
    title: "Pricing | Cursive",
    description:
      "Start with 25 free leads, no card. Then Visitor Pixel $97/mo, Custom Audience $197/mo, or the bundle for $247/mo. Month-to-month.",
    url: "https://www.meetcursive.com/pricing",
    siteName: "Cursive",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

interface Plan {
  slug: string
  name: string
  price: string
  cadence: string
  summary: string
  features: string[]
  cta: string
  highlight: boolean
}

const PLANS: Plan[] = [
  {
    slug: "pixel_97",
    name: "Visitor Pixel",
    price: "$97",
    cadence: "/mo",
    summary:
      "Identify the companies and people visiting your site. Installs in 60 seconds.",
    features: [
      "Deterministic visitor identification (40–60% resolution)",
      "Company + person-level detail on every visit",
      "60-second pixel install, no engineering required",
      "Identified visitors synced to your portal",
      "Month-to-month, cancel anytime",
    ],
    cta: "Get the Pixel",
    highlight: false,
  },
  {
    slug: "bundle_247",
    name: "Pixel + Audience Bundle",
    price: "$247",
    cadence: "/mo",
    summary:
      "Both the visitor pixel and the weekly audience: your site traffic and in-market buyers in one place.",
    features: [
      "Everything in Visitor Pixel",
      "Everything in Custom Audience",
      "Site traffic + in-market intent in one feed",
      "Priority audience updates within 24 hours",
      "Best value: save vs. buying separately",
    ],
    cta: "Get the Bundle",
    highlight: true,
  },
  {
    slug: "audience_197",
    name: "Custom Audience",
    price: "$197",
    cadence: "/mo",
    summary:
      "A fresh weekly list of people actively searching for your product, delivered to Google Sheets.",
    features: [
      "Weekly list of in-market prospects",
      "Built to your exact ICP and geography",
      "Delivered straight to Google Sheets",
      "First audience delivered within 24 hours",
      "No pixel or site traffic required",
    ],
    cta: "Get an Audience",
    highlight: false,
  },
]

const FAQS = [
  {
    q: "Are the 25 free leads really free?",
    a: "Yes. Paste your website, approve who your buyers are, and get 25 people with names, titles, work emails, and why each one fits. No card and no sales call. The list is yours to keep.",
  },
  {
    q: "What's the difference between the Pixel and the Audience?",
    a: "The Visitor Pixel identifies people already coming to your website: it turns anonymous traffic into named companies and contacts. The Custom Audience is proactive: each week we deliver a fresh list of people actively searching for what you sell, whether or not they've visited your site. The bundle gives you both.",
  },
  {
    q: "How fast can I get started?",
    a: "Immediately. Pick a plan, check out, and you're dropped straight into your portal. The pixel installs in about 60 seconds with a single snippet. Audience plans deliver your first list within 24 hours.",
  },
  {
    q: "Is there a contract or setup fee?",
    a: "No. Every plan is month-to-month with no setup fee. Cancel anytime from your portal.",
  },
  {
    q: "What data powers this?",
    a: "The same identity graph across every plan: 280M+ consumer records from offline-rooted sources, refreshed every 30 days, layered with intent signals from a 15M-domain organic network.",
  },
  {
    q: "Can I talk to someone before buying?",
    a: "Of course. Book a 30-minute call and we'll walk through your buyers, show you real data, and recommend the right plan. Or skip the call and start with 25 free leads.",
  },
] as const

const SERVICES = [
  {
    name: "Weekly leads",
    body: "25 new leads every Monday, matched to the buyer profile you approved, with work emails and LinkedIn links.",
    cta: "Start with 25 free",
    href: startUrl("pricing-weekly"),
    examples: false,
  },
  {
    name: "LinkedIn outreach",
    body: "We message your leads on LinkedIn so you only take the replies.",
    cta: "Book a call",
    href: BOOKING_URL,
    examples: false,
  },
  {
    name: "Custom AI dashboard",
    body: "One dashboard that shows where every lead, reply, and dollar stands.",
    cta: "Book a call",
    href: BOOKING_URL,
    examples: true,
  },
] as const

export default function PricingPage() {
  return (
    <>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Cursive",
            description:
              "Self-serve visitor identification and in-market audience plans. Visitor Pixel $97/mo, Custom Audience $197/mo, Pixel + Audience Bundle $247/mo.",
            provider: {
              "@type": "Organization",
              name: "Cursive",
              url: "https://www.meetcursive.com",
            },
            url: "https://www.meetcursive.com/pricing",
            areaServed: "Global",
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Cursive plans",
              itemListElement: [
                {
                  "@type": "Offer",
                  price: "97",
                  priceCurrency: "USD",
                  itemOffered: { "@type": "Service", name: "Visitor Pixel" },
                },
                {
                  "@type": "Offer",
                  price: "197",
                  priceCurrency: "USD",
                  itemOffered: { "@type": "Service", name: "Custom Audience" },
                },
                {
                  "@type": "Offer",
                  price: "247",
                  priceCurrency: "USD",
                  itemOffered: {
                    "@type": "Service",
                    name: "Pixel + Audience Bundle",
                  },
                },
              ],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.meetcursive.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Pricing",
                item: "https://www.meetcursive.com/pricing",
              },
            ],
          },
        ]}
      />

      <article className="bg-white text-gray-900">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative border-b border-gray-100 pt-20 pb-14 sm:pt-24 sm:pb-16 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-white to-white"
          />
          <Container className="relative max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Pricing
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl font-light tracking-tight text-gray-900 leading-[1.1]">
              Start free. Pay when you want more.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-relaxed">
              Your first 25 leads are free. After that, pick a self-serve plan
              or have us run outreach for you. Month-to-month, cancel anytime.
            </p>
            <div className="mt-8">
              <Link
                href={startUrl("pricing-hero")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                {START_CTA_LABEL}
                <span aria-hidden>→</span>
              </Link>
              <p className="mt-3 text-sm text-gray-500">No card. No sales call. About a minute.</p>
            </div>
          </Container>
        </section>

        {/* ── Plans ───────────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 py-16 sm:py-20">
          <Container className="max-w-5xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.slug}
                  className={`relative flex flex-col rounded-2xl border p-7 ${
                    plan.highlight
                      ? "border-primary shadow-lg ring-1 ring-primary/20"
                      : "border-gray-200"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-lg font-medium text-gray-900">
                    {plan.name}
                  </h2>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-light tracking-tight text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">{plan.cadence}</span>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                    {plan.summary}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-gray-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-2">
                    <Link
                      href={GET_LEADS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors ${
                        plan.highlight
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                      }`}
                    >
                      {plan.cta}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-gray-500">
              All plans are month-to-month. No setup fee. Cancel anytime.
            </p>
          </Container>
        </section>

        {/* ── Done for you ───────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 py-16 sm:py-20">
          <Container className="max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Done for you
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              Liked your 25? We can keep going.
            </h2>
            <dl className="mt-10 divide-y divide-gray-100 border-y border-gray-100">
              {SERVICES.map((svc) => (
                <div
                  key={svc.name}
                  className="grid grid-cols-1 gap-3 py-7 sm:grid-cols-[240px_1fr_auto] sm:items-center sm:gap-10"
                >
                  <dt className="text-base font-medium text-gray-900">{svc.name}</dt>
                  <dd className="text-[0.95rem] text-gray-700 leading-relaxed">
                    {svc.body}
                    {svc.examples && (
                      <>
                        {" "}
                        <a
                          href={DASHBOARD_EXAMPLES_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          See dashboards we&apos;ve built
                        </a>
                      </>
                    )}
                  </dd>
                  <dd>
                    <Link
                      href={svc.href}
                      {...(svc.href === BOOKING_URL ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
                    >
                      {svc.cta}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 py-20 sm:py-24">
          <Container className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Common Questions
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              Pricing FAQ.
            </h2>
            <dl className="mt-12 divide-y divide-gray-100 border-y border-gray-100">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-[260px_1fr] sm:gap-10"
                >
                  <dt className="text-base font-medium text-gray-900 leading-snug">
                    {faq.q}
                  </dt>
                  <dd className="text-[0.95rem] text-gray-700 leading-relaxed">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-20 sm:py-24">
          <Container className="max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Next Step
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              See who should buy from you.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-gray-600 leading-relaxed">
              Paste your website and get 25 leads free. Or book a quick call if
              you&apos;d like a walkthrough first.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={startUrl("pricing-bottom")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                {START_CTA_LABEL}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
              >
                Book a 30-Minute Call
              </Link>
            </div>
          </Container>
        </section>
      </article>
    </>
  )
}
