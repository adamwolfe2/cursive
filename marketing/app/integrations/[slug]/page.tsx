import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { OrganizationSchema } from "@/components/schema/SchemaMarkup"
import Link from "next/link"
import { integrations } from "@/lib/integrations-data"
import type { Integration } from "@/lib/integrations-data"

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
    title: `Cursive + ${integration.name} Integration | Connect Your Data`,
    description: `Connect Cursive visitor identification data with ${integration.name}. ${integration.whyCursive}`,
    keywords: integration.keywords,
    alternates: {
      canonical: `https://meetcursive.com/integrations/${integration.slug}`,
    },
    openGraph: {
      title: `Cursive + ${integration.name} Integration`,
      description: `Connect Cursive visitor data with ${integration.name}. Setup guide, workflows, and data mapping.`,
      type: "article",
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function connectionBadge(method: Integration["connectionMethod"]) {
  const styles: Record<
    Integration["connectionMethod"],
    { label: string; bg: string; text: string }
  > = {
    native: {
      label: "Native Integration",
      bg: "bg-green-100",
      text: "text-green-800",
    },
    webhook: {
      label: "Via Webhook",
      bg: "bg-blue-100",
      text: "text-blue-800",
    },
    zapier: {
      label: "Via Zapier",
      bg: "bg-purple-100",
      text: "text-purple-800",
    },
    csv: {
      label: "Via CSV Export",
      bg: "bg-gray-100",
      text: "text-gray-800",
    },
    "coming-soon": {
      label: "Coming Soon",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
    },
  }

  const s = styles[method]

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
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
    pageUrl: `https://meetcursive.com/integrations/${integration.slug}`,
  })

  return (
    <main>
      {/* ---- Schema markup ---- */}
      <OrganizationSchema />
      <StructuredData data={faqSchema} />

      {/* ---- Breadcrumbs ---- */}
      <section className="bg-white pt-6">
        <Container>
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Integrations", href: "/integrations" },
              { name: integration.name, href: `/integrations/${integration.slug}` },
            ]}
          />
        </Container>
      </section>

      {/* ---- Hero ---- */}
      <section className="pt-12 pb-20 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">{connectionBadge(integration.connectionMethod)}</div>

            <h1 className="text-4xl lg:text-6xl font-light text-gray-900 mb-6">
              Cursive + {integration.name} Integration
            </h1>

            <div className="prose prose-lg max-w-none text-gray-600 mb-6">
              <p>{integration.description}</p>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 mb-10">
              <p className="font-medium">{integration.whyCursive}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/free-audit"
                className="inline-flex items-center justify-center rounded-lg bg-[#007AFF] px-8 py-3 text-base text-white transition-colors hover:bg-[#0066DD]"
              >
                Get Started Free
              </Link>
              <Link
                href="/integrations"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base text-gray-700 transition-colors hover:bg-gray-50"
              >
                View All Integrations
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- Data Mapping ---- */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              How Your Data Flows
            </h2>
            <p className="text-gray-600 mb-10">
              When a visitor is identified by Cursive, here is exactly how that
              data maps into {integration.name}. No manual entry, no
              copy-pasting between tabs&mdash;just clean, structured records
              ready for your team to act on.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold text-gray-900">
                      Cursive Field
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-900">
                      {integration.name} Field
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-900">
                      What Happens
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {integration.dataMapping.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {row.cursiveField}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {row.toolField}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Need a field that is not listed?{" "}
              <Link
                href="/platform"
                className="text-[#007AFF] hover:underline"
              >
                Explore the Cursive platform
              </Link>{" "}
              to see every data point we capture, or reach out to our team for
              custom mapping.
            </p>
          </div>
        </Container>
      </section>

      {/* ---- Workflows ---- */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              What You Can Do
            </h2>
            <p className="text-gray-600 mb-10">
              Connecting Cursive with {integration.name} unlocks workflows that
              save hours every week and make sure no qualified lead slips through
              the cracks. Here are some of the most popular automations our
              customers set up on day one.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {integration.workflows.map((workflow, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-6"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {workflow.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {workflow.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm text-gray-500">
              These are just the starting point. With Cursive&apos;s{" "}
              <Link
                href="/visitor-identification"
                className="text-[#007AFF] hover:underline"
              >
                visitor identification
              </Link>{" "}
              data flowing into {integration.name}, you can build any workflow
              your revenue team needs.
            </p>
          </div>
        </Container>
      </section>

      {/* ---- Setup Guide ---- */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              How to Connect
            </h2>
            <p className="text-gray-600 mb-10">
              Getting Cursive and {integration.name} connected takes just a few
              minutes. Follow the steps below, and your team will have enriched
              visitor data flowing into {integration.name} before your next
              coffee break.
            </p>

            <ol className="space-y-6">
              {integration.setupSteps.map((step, idx) => (
                <li key={idx} className="flex gap-5">
                  <div className="flex-shrink-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007AFF] text-white text-sm font-semibold">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="border-l-2 border-[#007AFF]/20 pl-6 pb-2">
                    <p className="text-gray-800 leading-relaxed">{step}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  Need help getting set up?
                </span>{" "}
                Our team can walk you through the entire connection process
                during a{" "}
                <Link
                  href="/free-audit"
                  className="text-[#007AFF] hover:underline"
                >
                  free audit call
                </Link>
                . We will also review your current stack and recommend the
                highest-impact automations for your team.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- FAQ ---- */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-10">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              {integration.faqs.map((faq, idx) => (
                <div key={idx}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm text-gray-500">
              Have a question that is not answered here? Check our{" "}
              <Link
                href="/pricing"
                className="text-[#007AFF] hover:underline"
              >
                pricing page
              </Link>{" "}
              for plan details or{" "}
              <Link
                href="/free-audit"
                className="text-[#007AFF] hover:underline"
              >
                book a free audit
              </Link>{" "}
              to speak with our team.
            </p>
          </div>
        </Container>
      </section>

      {/* ---- Related Integrations ---- */}
      {related.length > 0 && (
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
                Related Integrations
              </h2>
              <p className="text-gray-600 mb-10">
                Looking for other {integration.category.toLowerCase()} tools
                that work with Cursive? These integrations pair well with{" "}
                {integration.name} and help you build a complete, connected
                revenue stack.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/integrations/${rel.slug}`}
                    className="block border border-gray-200 rounded-xl p-6 bg-white hover:border-[#007AFF] hover:shadow-lg transition-all group"
                  >
                    <span className="text-3xl mb-3 block">{rel.logo}</span>
                    <h3 className="text-base font-medium text-gray-900 mb-1 group-hover:text-[#007AFF] transition-colors">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-gray-500">{rel.category}</p>
                  </Link>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/integrations"
                  className="text-[#007AFF] hover:underline text-sm font-medium"
                >
                  Browse all integrations &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ---- Bottom CTA ---- */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-light text-gray-900 mb-6">
              Ready to connect Cursive with {integration.name}?
            </h2>
            <p className="text-lg text-gray-600 mb-10">
              Start identifying your website visitors and routing enriched data
              into {integration.name} in minutes. No credit card required for
              the free audit&mdash;just real insights about the companies already
              visiting your site.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/free-audit"
                className="inline-flex items-center justify-center rounded-lg bg-[#007AFF] px-8 py-3 text-base text-white transition-colors hover:bg-[#0066DD]"
              >
                Get Free Audit
              </Link>
              <Link
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 text-base text-gray-700 transition-colors hover:bg-gray-50"
              >
                Book a Demo
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-8">
              <span>No credit card required</span>
              <span className="text-gray-300">|</span>
              <span>Setup in 5 minutes</span>
              <span className="text-gray-300">|</span>
              <span>See results in 24 hours</span>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
