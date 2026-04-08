/**
 * Data Partnerships — enterprise reference page
 *
 * This is the source-of-truth document Cursive sends to enterprise data
 * buyers, intent partners, and procurement teams. Designed to read like a
 * trust / data infrastructure page (think Stripe, Plaid, AWS), not a
 * marketing landing page.
 *
 * Server component, no client JS, no animations — speed and credibility
 * matter more here than dynamic feel. Uses the global Header / Footer from
 * marketing/app/layout.tsx.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"

export const metadata: Metadata = {
  title: "Data Partnerships | Cursive",
  description:
    "Cursive's identity and intent infrastructure: 280M+ verified consumers from offline-rooted sources, refreshed every 30 days. 15M-domain organic network, ~50K intent segments, closed feedback loop. Reference document for enterprise data buyers and partners.",
  alternates: {
    canonical: "https://www.meetcursive.com/data-partnerships",
  },
  openGraph: {
    title: "Data Partnerships | Cursive",
    description:
      "Enterprise reference: identity & intent data infrastructure built on offline-rooted consumer sources, refreshed every 30 days, validated against real conversion outcomes.",
    url: "https://www.meetcursive.com/data-partnerships",
    siteName: "Cursive",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const SECTIONS = [
  { id: "data-sourcing", n: "01", title: "Data Sourcing" },
  { id: "data-quality", n: "02", title: "Data Quality" },
  { id: "coverage", n: "03", title: "Coverage & Licensed Partners" },
  { id: "enrichment", n: "04", title: "Waterfall Enrichment" },
  { id: "partnership", n: "05", title: "Partnership Structure" },
  { id: "proof-of-concept", n: "06", title: "Proof of Concept" },
] as const

const KEY_FACTS = [
  { value: "280M+", label: "Verified consumers" },
  { value: "15M+", label: "Organic-network domains" },
  { value: "30-day", label: "NCOA refresh cycle" },
  { value: "40–60%", label: "Pixel match rate" },
  { value: "~50K", label: "Intent segments" },
  { value: "~20M", label: "Emails validated daily" },
] as const

export default function DataPartnershipsPage() {
  return (
    <>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Data Partnerships at Cursive",
            description:
              "Cursive's identity and intent data infrastructure — sourcing, quality, coverage, enrichment, partnership structure, and proof-of-concept process.",
            url: "https://www.meetcursive.com/data-partnerships",
            publisher: {
              "@type": "Organization",
              name: "Cursive",
              url: "https://www.meetcursive.com",
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
                name: "Data Partnerships",
                item: "https://www.meetcursive.com/data-partnerships",
              },
            ],
          },
        ]}
      />

      <article className="bg-white text-gray-900">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative border-b border-gray-100 pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
          {/* Subtle brand-color wash so the page reads as Cursive at first glance
              instead of a generic doc page. Soft enough to keep the enterprise
              tone — visible enough to ground the brand. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/40 via-white to-white"
          />
          <Container className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Data Partnership Overview
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl font-light tracking-tight text-gray-900 leading-[1.1]">
              The Identity and Intent
              <br className="hidden sm:block" /> Infrastructure Behind&nbsp;
              <span className="font-cursive text-primary text-[1.1em] leading-none">
                Cursive
              </span>
              .
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              A reference for data buyers, intent partners, and enterprise
              procurement teams evaluating Cursive as a data layer. The pages
              below describe how the data is sourced, how we verify it, what
              we license and what we don&apos;t, and how partnership engagements
              are structured.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated April&nbsp;2026. For commercial questions, contact{" "}
              <a
                href="mailto:partnerships@meetcursive.com"
                className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
              >
                partnerships@meetcursive.com
              </a>
              .
            </p>
          </Container>
        </section>

        {/* ── Key facts strip ─────────────────────────────────────────────── */}
        {/* 3 cols × 2 rows on desktop. Was 6 columns, but stat values like
            "~20M / day" wrapped because per-column width was too narrow. The
            3×2 layout gives every value the same horizontal weight and lets
            the numbers breathe without any value wrapping. */}
        <section className="border-b border-gray-100 py-14">
          <Container className="max-w-5xl">
            <dl className="grid grid-cols-2 gap-y-10 gap-x-8 sm:grid-cols-3">
              {KEY_FACTS.map((fact) => (
                <div key={fact.label} className="text-left">
                  <dt className="font-mono text-[1.75rem] font-light leading-none text-gray-900 whitespace-nowrap">
                    {fact.value}
                  </dt>
                  <dd className="mt-2.5 text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    {fact.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* ── Table of contents ───────────────────────────────────────────── */}
        <section className="border-b border-gray-100 py-10">
          <Container className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Contents
            </p>
            <ol className="mt-5 space-y-2.5">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="group flex items-baseline gap-4 text-base text-gray-700 hover:text-primary transition-colors"
                  >
                    <span className="font-mono text-xs text-primary/60 group-hover:text-primary">
                      {section.n}
                    </span>
                    <span className="border-b border-transparent group-hover:border-primary/40">
                      {section.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* ── Section 01 — Data Sourcing ──────────────────────────────────── */}
        <Section id="data-sourcing" n="01" title="Data Sourcing">
          <p>
            Cursive&apos;s consumer identity graph is sourced primarily from
            offline data partners — including TransUnion and Experian — rather
            than purely digital signals. The result is a data set rooted in
            verified, authoritative records, not probabilistic matches inferred
            from cookies or device IDs.
          </p>
          <p>
            The full data set is refreshed every 30 days against the National
            Change of Address (NCOA) database. Most data providers run NCOA
            reconciliation annually; serious providers do it quarterly. With
            roughly 15% of the U.S. population moving each year, our 30-day
            cycle keeps records meaningfully more current than industry norms.
          </p>
          <p>
            The raw consumer file is not licensed as a downloadable export. It
            is accessible exclusively through our API.
          </p>
        </Section>

        {/* ── Section 02 — Data Quality ───────────────────────────────────── */}
        <Section id="data-quality" n="02" title="Data Quality">
          <FactGrid
            items={[
              {
                label: "Refresh cadence",
                value: "Every 30 days (NCOA)",
                detail:
                  "Versus annual or quarterly cycles at most providers. Approximately 15% of the U.S. population relocates each year — our 30-day cycle ensures address and contact records stay current.",
              },
              {
                label: "Pixel match rate",
                value: "40–60%",
                detail:
                  "Driven by our geo-framing methodology. For comparison, cookie-based providers see 2–5% and standard IP databases see 10–15%.",
              },
              {
                label: "Pixel-level accuracy",
                value: "60–80%",
                detail:
                  "Deterministic match accuracy, not modeled or probabilistic. The range reflects variation across site traffic quality.",
              },
              {
                label: "Email validation",
                value: "~20M / day",
                detail:
                  "All email records pass through Deep Verify, our in-house validation platform, at a sustained rate of approximately 20 million emails per day.",
              },
            ]}
          />
        </Section>

        {/* ── Section 03 — Coverage ───────────────────────────────────────── */}
        <Section id="coverage" n="03" title="Coverage & Licensed Partners">
          <p>
            Our identity graph is fed by major publishers (including Sovereign),
            large exchanges (including Yahoo), and multiple real-time bidding
            feeds. We do not disclose individual partner names beyond those
            already public.
          </p>
          <p>
            Most intent providers in the market draw from the same finite pool
            of raw feeds — roughly 700,000 SSP publisher sites, of which only
            about 40,000 actually generate the underlying intent signals. We
            ingest from substantially all of them.
          </p>
          <Callout title="What materially differentiates Cursive">
            <p>
              In addition to standard SSP and RTB feeds, Cursive operates its
              own organic network of more than{" "}
              <strong className="font-medium text-gray-900">
                15&nbsp;million domains
              </strong>{" "}
              — websites with our pixel installed or sending data exhaust
              directly to us. We then map ingested intent signals back to the
              URLs, mobile apps, and email exchanges that originally generated
              them, using conversion data as the validation layer.
            </p>
            <p className="mt-4">
              The result is a data set that is continuously corrected against
              real outcomes rather than degrading over time. This combination —
              major SSP and RTB feeds, layered with a proprietary 15M-domain
              organic network, validated through a closed feedback loop — is
              not, to our knowledge, offered by any other intent provider.
            </p>
          </Callout>
        </Section>

        {/* ── Section 04 — Waterfall Enrichment ───────────────────────────── */}
        <Section id="enrichment" n="04" title="Waterfall Enrichment">
          <p>
            Enrichment is delivered in two configurations, depending on whether
            the partner is consolidating data ops or layering Cursive into an
            existing waterfall.
          </p>
          <FactGrid
            items={[
              {
                label: "Bulk append",
                value: "Monthly refresh",
                detail:
                  "Match and enrich against your existing customer or prospect records on a recurring monthly cycle.",
              },
              {
                label: "Real-time API waterfall",
                value: "Per-record endpoint",
                detail:
                  "Programmatic enrichment via API, designed to layer into existing data stacks alongside other providers.",
              },
            ]}
          />
          <p>
            Available enrichment includes intent data, behavioral signals, and
            consumer-level B2B/B2C linkage. The exact configuration depends on
            the gaps in your current stack — we&apos;re happy to scope this
            against your existing providers.
          </p>
        </Section>

        {/* ── Section 05 — Partnership Structure ──────────────────────────── */}
        <Section id="partnership" n="05" title="Partnership Structure">
          <p>
            Given the 30-day refresh cycle and the sensitivity of consumer-level
            data, the raw file is not licensed directly. Access is provided
            through API endpoints under one of two structures:
          </p>
          <FactGrid
            items={[
              {
                label: "Pay-as-you-go",
                value: "No commitment",
                detail:
                  "Per-record pricing with no monthly minimum. Designed for evaluation and lower-volume use cases.",
              },
              {
                label: "Committed tiers",
                value: "From $15K / month",
                detail:
                  "Significantly lower per-record economics. Designed for scaled production use and enterprise data programs.",
              },
            ]}
          />
          <p>
            For enterprise volumes, we structure agreements that reflect
            commitment level and intended use case. We&apos;re happy to scope
            this in detail once we understand your data needs.
          </p>
        </Section>

        {/* ── Section 06 — POC ────────────────────────────────────────────── */}
        <Section id="proof-of-concept" n="06" title="Proof of Concept">
          <p>
            The most reliable way to evaluate Cursive&apos;s data quality is a{" "}
            <strong className="font-medium text-gray-900">
              conversion look-back
            </strong>
            :
          </p>
          <ol className="mt-2 space-y-3 border-l border-gray-200 pl-6 text-gray-700">
            <li>
              <span className="block font-mono text-xs text-gray-400">
                STEP 01
              </span>
              You provide a hashed list of known buyers or converted accounts.
            </li>
            <li>
              <span className="block font-mono text-xs text-gray-400">
                STEP 02
              </span>
              We reverse-engineer the behavioral signals and intent segments
              those individuals were part of in the period leading up to
              conversion.
            </li>
            <li>
              <span className="block font-mono text-xs text-gray-400">
                STEP 03
              </span>
              You receive a controlled view of which segments and behaviors
              actually correlate with real outcomes — no noise from an
              uncontrolled live test.
            </li>
          </ol>
          <p>
            We can also onboard a sample of customer data (e.g. 10,000 hashed
            records) and demonstrate which of our segments those customers
            participated in over the previous seven days.
          </p>
          <p className="font-medium text-gray-900">
            Once validated, we issue two endpoints:
          </p>
          <FactGrid
            items={[
              {
                label: "Taxonomy endpoint",
                value: "~50K segments",
                detail:
                  "Access to approximately 50,000 intent segments, available for white-label use with your own customers.",
              },
              {
                label: "Feedback loop endpoint",
                value: "Closed-loop pixel",
                detail:
                  "Lets your customers install an intent pixel that feeds directly back into the audience graph. Within a few weeks of feedback, segments can be optimized for material performance gains.",
              },
            ]}
          />
        </Section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="border-t border-gray-100 bg-gray-50 py-20 sm:py-24">
          <Container className="max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Next Step
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              Start a Data Conversation.
            </h2>
            <p className="mt-5 text-base text-gray-600 leading-relaxed">
              We&apos;ll scope a conversion look-back against your own data,
              walk through the API surface, and propose a pricing structure
              that fits your volume.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="https://cal.com/cursiveteam/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Schedule a call
              </Link>
              <a
                href="mailto:partnerships@meetcursive.com"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
              >
                Email our data team
              </a>
            </div>
          </Container>
        </section>
      </article>
    </>
  )
}

// ─── Internal building blocks ─────────────────────────────────────────────────

interface SectionProps {
  id: string
  n: string
  title: string
  children: React.ReactNode
}

function Section({ id, n, title, children }: SectionProps) {
  return (
    <section id={id} className="border-b border-gray-100 py-20 sm:py-24 scroll-mt-24">
      <Container className="max-w-3xl">
        <div className="flex items-baseline gap-5">
          <span className="font-mono text-xs text-gray-400">{n}</span>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
            {title}
          </h2>
        </div>
        <div className="mt-8 space-y-6 text-base leading-relaxed text-gray-700 [&_p]:leading-relaxed">
          {children}
        </div>
      </Container>
    </section>
  )
}

interface FactItem {
  label: string
  value: string
  detail: string
}

function FactGrid({ items }: { items: FactItem[] }) {
  return (
    <dl className="my-2 divide-y divide-gray-100 border-y border-gray-100">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[180px_1fr] sm:gap-8"
        >
          <dt>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {item.label}
            </div>
            <div className="mt-1.5 font-mono text-base text-gray-900">
              {item.value}
            </div>
          </dt>
          <dd className="text-sm text-gray-600 leading-relaxed sm:text-[0.95rem]">
            {item.detail}
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface CalloutProps {
  title: string
  children: React.ReactNode
}

function Callout({ title, children }: CalloutProps) {
  return (
    <div className="my-8 border-l-2 border-gray-900 bg-gray-50/60 px-7 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-900">
        {title}
      </p>
      <div className="mt-3 text-[0.95rem] leading-relaxed text-gray-700">
        {children}
      </div>
    </div>
  )
}
