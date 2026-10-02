import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FAQSection } from "@/components/homepage/faq-section"
import { IntegrationsLine } from "@/components/homepage/integrations-line"
import { PageHero, Section, SecondaryLink, FinalCta, BOOKING_URL } from "@/components/secondary/page-kit"
import { integrations, type Integration } from "@/lib/integrations-data"
import { integrationsFaqs } from "./faq-data"

/* Integrations: where leads go, then a plain index of setup guides grouped by category. */

function groupByCategory(items: Integration[]): Array<{ category: string; items: Integration[] }> {
  const map = new Map<string, Integration[]>()
  for (const item of items) map.set(item.category, [...(map.get(item.category) ?? []), item])
  return Array.from(map, ([category, list]) => ({ category, items: list }))
}

export default function IntegrationsPage() {
  const groups = groupByCategory(integrations)
  return (
    <div className="bg-white">
      <PageHero
        id="integrations-title"
        kicker="Integrations"
        title="Send your leads to the tools you already use"
        lead="Export to CSV, send by webhook or pass through Zapier. Your list lands in your CRM, inbox or sequencer, ready to work."
      >
        <SecondaryLink href={BOOKING_URL}>Book a call</SecondaryLink>
      </PageHero>

      <div className="pt-8">
        <IntegrationsLine />
      </div>

      <Section
        id="guides"
        title="Setup guides"
        lead={`${integrations.length} tools with a guide for the field mapping and the steps. Most connect through a webhook or Zapier.`}
      >
        {groups.map((g) => (
          <div key={g.category} className="mt-12">
            <h3 className="border-b border-[#e2e8f0] pb-3 text-[15px] font-semibold text-[#0066DD]">{g.category}</h3>
            <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((i) => (
                <li key={i.slug} className="border-b border-[#eef1f5]">
                  <Link
                    href={`/integrations/${i.slug}`}
                    className="group flex min-h-14 items-center justify-between gap-3 py-3 text-[16px] font-semibold text-[#0f172a] transition-colors hover:text-[#0066DD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
                  >
                    <span className="flex items-center gap-3">
                      {i.logo.startsWith("/") ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small static logo
                        <img src={i.logo} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                      ) : (
                        <span aria-hidden="true" className="w-6 text-center text-xl leading-none">{i.logo}</span>
                      )}
                      {i.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#94a3b8] transition-colors group-hover:text-[#007AFF]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <FAQSection
        items={integrationsFaqs}
        pageUrl="https://www.meetcursive.com/integrations"
        title="Integration questions"
        intro="How leads get out and what it takes to set up."
      />

      <FinalCta id="integrations-cta" placement="integrations-final-cta" />
    </div>
  )
}
