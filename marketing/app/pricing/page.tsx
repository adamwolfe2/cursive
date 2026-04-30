/**
 * Pricing — talk-to-us page
 *
 * Cursive's pricing is structured per use case and volume, not published
 * as fixed tiers. Every prospect goes through a discovery call with the
 * team so we can scope the right engagement (data partnership, audience
 * access, managed services, marketplace credits). This page replaces the
 * old self-serve pricing tiers with a single contact-driven flow.
 *
 * URL is preserved (/pricing) so existing inbound links and SEO signals
 * carry over. Server component, no client JS — keeps it fast and clean.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"

const BOOKING_URL = "https://cal.com/cursiveteam/30min"

export const metadata: Metadata = {
  title: "Pricing | Cursive",
  description:
    "Cursive's pricing is structured per use case and volume — data partnerships, audience access, managed services, and marketplace credits. Every engagement is scoped on a 30-minute discovery call.",
  alternates: {
    canonical: "https://www.meetcursive.com/pricing",
  },
  openGraph: {
    title: "Pricing | Cursive",
    description:
      "Pricing structured per use case and volume. Data partnerships, audience access, managed services, marketplace credits. Schedule a 30-minute scoping call.",
    url: "https://www.meetcursive.com/pricing",
    siteName: "Cursive",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const ENGAGEMENT_PATHS = [
  {
    n: "01",
    name: "Data & API Partnerships",
    summary:
      "Identity, intent, and enrichment delivered via API. Pay-as-you-go for evaluation, or committed tiers from $15K/month for scaled production use.",
    bullets: [
      "Pixel identification + audience enrichment",
      "~50,000 white-label intent segments via taxonomy endpoint",
      "Closed-loop feedback pixel for continuous segment improvement",
      "Bulk append (monthly) or real-time API waterfall",
    ],
    cta: { label: "Read the partnership overview", href: "/data-partnerships" },
  },
  {
    n: "02",
    name: "Managed Services",
    summary:
      "Done-for-you outbound built on the Cursive data layer. Cursive Data, Cursive Outbound, and Cursive Pipeline are scoped per ICP, monthly volume, and channel mix.",
    bullets: [
      "Cursive Data — verified contacts delivered monthly to your CRM",
      "Cursive Outbound — campaigns built, launched, and optimized for you",
      "Cursive Pipeline — full AI SDR with multi-channel follow-up",
      "Cursive Venture Studio — white-glove partnership for high-volume programs",
    ],
    cta: { label: "See the services overview", href: "/services" },
  },
  {
    n: "03",
    name: "Self-Serve Marketplace",
    summary:
      "Buy verified leads on demand. Marketplace credits and the Cursive platform are available for teams that prefer to build and run programs in-house.",
    bullets: [
      "Pay-as-you-go pricing per record",
      "Filter by industry, geography, intent, and seniority",
      "Direct sync to your CRM",
      "Same identity graph as enterprise partnerships",
    ],
    cta: { label: "Explore the marketplace", href: "/marketplace" },
  },
] as const

const FAQS = [
  {
    q: "Why don't you publish fixed prices?",
    a: "Cursive's data layer powers very different use cases — a partner licensing white-label intent segments has a fundamentally different cost structure than a team buying enriched contacts off the marketplace. Publishing one set of tiers would either over-charge the small use cases or under-resource the large ones. We scope every engagement so the price reflects the actual work and data volume.",
  },
  {
    q: "What's the smallest engagement you offer?",
    a: "There's no formal minimum. The marketplace starts at pay-as-you-go pricing per record with no commitment. Managed services start with Cursive Data at the entry tier. Data partnerships have a committed tier from $15K/month for scaled production use, with pay-as-you-go available for evaluation.",
  },
  {
    q: "What happens on the call?",
    a: "A 30-minute working session with the team. We'll ask about your ICP, current data stack, monthly volume, and what you're trying to solve. You'll see a live walkthrough of the platform on real data, and we'll propose a structure that fits — usually with a follow-up sandbox or look-back POC against your own customer list.",
  },
  {
    q: "How quickly can we get started?",
    a: "Marketplace and self-serve programs are live the same day. Managed services are typically scoped and launched within one to two weeks of the discovery call. Enterprise data partnerships move on a procurement timeline that fits your team — we can run a conversion look-back POC in parallel so you have evidence before signing anything.",
  },
  {
    q: "Do you offer a free trial or proof of concept?",
    a: "Yes. For data partnerships, the standard POC is a conversion look-back: you provide a hashed list of known buyers, and we reverse-engineer the segments and behavioral signals those individuals were part of in the period leading up to conversion. This gives you a controlled view of data quality without an open-ended live test. We can also onboard a sample of customer data (e.g. 10,000 hashed records) and demonstrate which segments those customers participated in over the previous seven days.",
  },
  {
    q: "Is the data the same across all engagement paths?",
    a: "Yes. Whether you access Cursive through the marketplace, a managed service, or a data partnership, you're querying the same identity graph — 280M+ verified consumer records sourced from offline partners (TransUnion, Experian), refreshed every 30 days against the National Change of Address database, layered with intent signals from our 15M-domain organic network and standard SSP/RTB feeds.",
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
              "Identity and intent data infrastructure offered through data partnerships, managed services, and a self-serve marketplace. Pricing scoped per use case and volume.",
            provider: {
              "@type": "Organization",
              name: "Cursive",
              url: "https://www.meetcursive.com",
            },
            url: "https://www.meetcursive.com/pricing",
            areaServed: "Global",
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Cursive engagement paths",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Data & API Partnerships",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Managed Services",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Self-Serve Marketplace",
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
        <section className="relative border-b border-gray-100 pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/40 via-white to-white"
          />
          <Container className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Pricing
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl font-light tracking-tight text-gray-900 leading-[1.1]">
              Built Around Your Data Needs.
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Cursive&apos;s pricing is structured per use case and volume — not as
              a fixed list of tiers. Every engagement is scoped on a 30-minute
              call so the structure fits the data, the channels, and the team
              that will actually use it.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Book a 30-Minute Call
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/data-partnerships"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
              >
                See the data partnership overview
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Or email{" "}
              <a
                href="mailto:hey@meetcursive.com"
                className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
              >
                hey@meetcursive.com
              </a>{" "}
              with a one-paragraph description of what you&apos;re solving and we&apos;ll
              come back with a structure proposal.
            </p>
          </Container>
        </section>

        {/* ── Engagement paths ────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 py-20 sm:py-24">
          <Container className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How We Work
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              Three engagement paths.
            </h2>
            <p className="mt-5 text-base text-gray-600 leading-relaxed">
              Every Cursive customer accesses the same identity and intent
              infrastructure — the differences below are about how that data is
              delivered, who operates the workflow, and how the commercials are
              structured.
            </p>

            <div className="mt-12 space-y-12">
              {ENGAGEMENT_PATHS.map((path) => (
                <div key={path.n}>
                  <div className="flex items-baseline gap-5">
                    <span className="font-mono text-xs text-primary">{path.n}</span>
                    <h3 className="text-xl sm:text-2xl font-light tracking-tight text-gray-900">
                      {path.name}
                    </h3>
                  </div>
                  <p className="mt-4 text-base text-gray-600 leading-relaxed pl-[44px]">
                    {path.summary}
                  </p>
                  <ul className="mt-5 space-y-2.5 pl-[44px]">
                    {path.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-[0.95rem] text-gray-700"
                      >
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pl-[44px]">
                    <Link
                      href={path.cta.href}
                      className="text-sm font-medium text-primary hover:underline underline-offset-4"
                    >
                      {path.cta.label} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Mid-page CTA ────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 bg-gray-50 py-16">
          <Container className="max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Talk to the Team
            </p>
            <h2 className="mt-5 text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
              Every engagement starts with a 30-minute call.
            </h2>
            <p className="mt-5 text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
              Walk through your ICP, current data stack, and what you&apos;re
              trying to solve. You&apos;ll see the platform on real data and leave
              with a proposed structure.
            </p>
            <div className="mt-8">
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Schedule a Call
                <span aria-hidden>→</span>
              </Link>
            </div>
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
              Let&apos;s Scope Your Engagement.
            </h2>
            <p className="mt-5 text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
              Pick a time that works. We&apos;ll come prepared with relevant
              examples and a structure proposal you can take back to your team.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Book a 30-Minute Call
              </Link>
              <a
                href="mailto:hey@meetcursive.com"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
              >
                Email hey@meetcursive.com
              </a>
            </div>
          </Container>
        </section>
      </article>
    </>
  )
}
