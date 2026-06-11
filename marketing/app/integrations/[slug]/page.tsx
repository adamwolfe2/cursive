import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { OrganizationSchema } from "@/components/schema/SchemaMarkup"
import Link from "next/link"
import { ArrowRight, Workflow, Plug, HelpCircle, type LucideIcon } from "lucide-react"
import { integrations } from "@/lib/integrations-data"
import type { Integration } from "@/lib/integrations-data"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

// ---------------------------------------------------------------------------
// Static params + metadata
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return integrations.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const integration = integrations.find((i) => i.slug === slug)
  if (!integration) return {}

  return {
    title: `${integration.name} Visitor Identification Integration — Push Identified Leads Directly | Cursive`,
    description: `Resolve anonymous visitors with a 40–60% deterministic pixel match rate and push them directly into ${integration.name}. ${integration.whyCursive}`,
    keywords: integration.keywords,
    alternates: {
      canonical: `https://www.meetcursive.com/integrations/${integration.slug}`,
    },
    openGraph: {
      title: `${integration.name} Visitor Identification Integration | Cursive`,
      description: `Resolve anonymous visitors with a 40–60% deterministic pixel match rate and push enriched lead records directly into ${integration.name}. Setup guide, workflows, and data mapping.`,
      type: "article",
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function connectionBadge(method: Integration["connectionMethod"]) {
  const labels: Record<Integration["connectionMethod"], string> = {
    native: "Native Integration",
    webhook: "Via Webhook",
    zapier: "Via Zapier",
    csv: "Via CSV Export",
    "coming-soon": "Coming Soon",
  }

  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
      {labels[method]}
    </span>
  )
}

function IconChip({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

function SectionHeading({ plain, script, sub }: { plain: string; script?: string; sub?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
        {plain}
        {script && (
          <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
            {script}
          </span>
        )}
      </h2>
      {sub && (
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{sub}</p>
      )}
    </div>
  )
}

function getRelatedIntegrations(
  current: Integration,
  all: Integration[],
  limit = 4
): Integration[] {
  return all
    .filter((i) => i.category === current.category && i.slug !== current.slug)
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function IntegrationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const integration = integrations.find((i) => i.slug === slug)
  if (!integration) notFound()

  const related = getRelatedIntegrations(integration, integrations)

  const faqSchema = generateFAQSchema({
    faqs: integration.faqs,
    pageUrl: `https://www.meetcursive.com/integrations/${integration.slug}`,
  })

  return (
    <main className="overflow-hidden">
      {/* ---- Schema markup ---- */}
      <OrganizationSchema />
      <StructuredData data={faqSchema} />

      {/* ---- Breadcrumbs ---- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Integrations", href: "/integrations" },
            { name: integration.name, href: `/integrations/${integration.slug}` },
          ]}
        />
      </div>

      {/* ---- Hero ---- */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 bg-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center">{connectionBadge(integration.connectionMethod)}</div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
              Cursive + {integration.name}
              <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                Integration
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
              {integration.whyCursive}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href={GET_LEADS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base text-white transition-colors hover:bg-primary-dark"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base text-gray-700 transition-colors hover:bg-gray-50"
              >
                Book a Call
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- Data Mapping ---- */}
      <section className="py-20 sm:py-24 bg-[#F7F9FB]">
        <Container>
          <SectionHeading
            plain="How Your"
            script="Data Flows"
            sub={`When Cursive identifies a visitor, here is exactly how that data maps into ${integration.name}. No manual entry, just clean, structured records.`}
          />

          <div className="max-w-4xl mx-auto overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-900">Cursive Field</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">
                    {integration.name} Field
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-900">What Happens</th>
                </tr>
              </thead>
              <tbody>
                {integration.dataMapping.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-gray-900 font-medium">{row.cursiveField}</td>
                    <td className="px-6 py-4 text-gray-900">{row.toolField}</td>
                    <td className="px-6 py-4 text-gray-600">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-4xl mx-auto text-center text-sm text-gray-500">
            Need a field that is not listed?{" "}
            <Link href="/platform" className="text-primary hover:underline">
              Explore the Cursive platform
            </Link>{" "}
            to see every data point we capture.
          </p>
        </Container>
      </section>

      {/* ---- Workflows ---- */}
      <section className="py-20 sm:py-24 bg-white">
        <Container>
          <SectionHeading
            plain="What You"
            script="Can Do"
            sub={`Connecting Cursive with ${integration.name} unlocks workflows that save hours every week and make sure no qualified lead slips through the cracks.`}
          />

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {integration.workflows.map((workflow, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
              >
                <IconChip Icon={Workflow} />
                <h3 className="mt-5 text-lg font-medium text-gray-900">{workflow.title}</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {workflow.description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-3xl mx-auto text-center text-sm text-gray-500">
            With Cursive&apos;s{" "}
            <Link href="/visitor-identification" className="text-primary hover:underline">
              visitor identification
            </Link>{" "}
            data flowing into {integration.name}, you can build any workflow your revenue team
            needs.
          </p>
        </Container>
      </section>

      {/* ---- Setup Guide ---- */}
      <section className="py-20 sm:py-24 bg-[#F7F9FB]">
        <Container>
          <SectionHeading
            plain="How to"
            script="Connect"
            sub={`Getting Cursive and ${integration.name} connected takes just a few minutes. Follow the steps below.`}
          />

          <ol className="max-w-3xl mx-auto space-y-4">
            {integration.setupSteps.map((step, idx) => (
              <li
                key={idx}
                className="flex gap-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {idx + 1}
                </span>
                <p className="text-gray-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <IconChip Icon={Plug} />
              <p className="text-sm text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-900">Need help getting set up?</span>{" "}
                Our team can walk you through the entire connection process on a{" "}
                <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  quick call
                </Link>{" "}
                and recommend the highest-impact automations for your stack.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- FAQ ---- */}
      <section className="py-20 sm:py-24 bg-white">
        <Container>
          <SectionHeading plain="Frequently Asked" script="Questions" />

          <div className="max-w-3xl mx-auto space-y-4">
            {integration.faqs.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 p-6 sm:p-7">
                <h3 className="flex items-start gap-3 text-base font-medium text-gray-900">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="mt-2 pl-8 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl mx-auto text-center text-sm text-gray-500">
            Have a question that is not answered here? Check our{" "}
            <Link href="/pricing" className="text-primary hover:underline">
              pricing page
            </Link>{" "}
            for plan details, or{" "}
            <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              book a call
            </Link>{" "}
            to speak with our team.
          </p>
        </Container>
      </section>

      {/* ---- Related Integrations ---- */}
      {related.length > 0 && (
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Related"
              script="Integrations"
              sub={`Other ${integration.category.toLowerCase()} tools that pair well with ${integration.name} and Cursive.`}
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/integrations/${rel.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-lg transition-all"
                >
                  <div>
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {rel.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">{rel.category}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/integrations"
                className="text-sm font-medium text-primary hover:underline"
              >
                Browse all integrations &rarr;
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* ---- Bottom CTA ---- */}
      <section className="py-20 sm:py-28 bg-white">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
              Ready to connect Cursive
              <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                with {integration.name}?
              </span>
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Start identifying your website visitors and routing enriched data into{" "}
              {integration.name} in minutes. Plans from $97/mo, month-to-month, cancel anytime.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href={GET_LEADS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base text-white transition-colors hover:bg-primary-dark"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base text-gray-700 transition-colors hover:bg-gray-50"
              >
                Book a Call
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
