/**
 * Pricing: the three rungs from the homepage (find, reach, run), shared via PricingGrid so the two never drift.
 * Prices approved 2026-10-01 (.claude/specs/2026-10-01-cursive-pivot.md). URL kept for inbound links and SEO.
 */

import type { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { FAQSection } from "@/components/homepage/faq-section"
import { pricingFaqs } from "@/components/homepage/faq-data"
import { PricingGrid } from "@/components/homepage/ladder-sections"
import { SiteForm } from "@/components/homepage/start-hero"
import { Stage } from "@/components/homepage/stage"
import { H2 } from "@/components/homepage/type"
import { PlanGuide } from "./plan-guide"

const DESCRIPTION =
  "25 free leads from your website, no card. Then lead credits from $49, Starter at $197/mo, Growth at $497/mo, done-for-you outreach from $1,497/mo, or a custom dashboard from $2,500. Month-to-month."

export const metadata: Metadata = {
  title: "Pricing | Cursive",
  description: DESCRIPTION,
  keywords: ["B2B lead generation pricing", "lead credits", "cost per lead", "LinkedIn outreach pricing", "done-for-you outreach cost", "cursive pricing"],
  alternates: { canonical: "https://www.meetcursive.com/pricing" },
  openGraph: { title: "Pricing | Cursive", description: DESCRIPTION, url: "https://www.meetcursive.com/pricing", siteName: "Cursive", type: "website" },
  robots: { index: true, follow: true },
}

const OFFERS: Array<[name: string, price: string, unit?: string]> = [
  ["Free 25 leads", "0"],
  ["Lead credits, 100 leads", "49"],
  ["Lead credits, 500 leads", "199"],
  ["Lead credits, 2,000 leads", "599"],
  ["Starter", "197", "MON"],
  ["Growth", "497", "MON"],
  ["LinkedIn outreach", "1497", "MON"],
  ["LinkedIn + email outreach", "2497", "MON"],
  ["Operating system setup (from)", "2500"],
  ["Visitor Pixel", "97", "MON"],
]

export default function PricingPage() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Cursive",
          description: DESCRIPTION,
          provider: { "@type": "Organization", name: "Cursive", url: "https://www.meetcursive.com" },
          url: "https://www.meetcursive.com/pricing",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Cursive plans",
            itemListElement: OFFERS.map(([name, price, unit]) => ({
              "@type": "Offer",
              price,
              priceCurrency: "USD",
              ...(unit && { priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "USD", unitCode: unit } }),
              itemOffered: { "@type": "Service", name },
            })),
          },
        }}
      />

      <div className="bg-white">
        <section aria-labelledby="pricing-title" className="px-6 pb-14 pt-16 text-center sm:pb-20 sm:pt-24">
          <h1 id="pricing-title" className="mx-auto max-w-[18ch] text-[2.375rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0f172a] sm:text-[3.5rem]">
            Start free. Pay only for the step you need.
          </h1>
          <p className="mx-auto mt-5 max-w-[50ch] text-[17px] leading-relaxed text-[#475569] sm:text-[19px]">
            25 leads from your website cost nothing. After that, buy credits, take leads every week, have us run the
            outreach or build your dashboard. Month&#8209;to&#8209;month, every plan.
          </p>
        </section>

        <div className="px-4 sm:px-6">
          <PricingGrid />
        </div>

        <PlanGuide />

        <FAQSection
          items={pricingFaqs}
          pageUrl="https://www.meetcursive.com/pricing"
          title="Pricing questions"
          intro="Billing, credits and contracts. For anything else, book a call."
        />

        <section aria-labelledby="pricing-cta" className="px-2 pb-20 pt-4 sm:px-4 sm:pb-28">
          <Stage className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
              <h2 id="pricing-cta" className={H2}>
                See your first 25 before you pay anything
              </h2>
              <p className="mt-3 text-[17px] leading-relaxed text-[#475569]">Free, no card, about a minute.</p>
              <SiteForm placement="pricing-final-cta" className="mx-auto mt-8" />
            </div>
          </Stage>
        </section>
      </div>
    </>
  )
}
