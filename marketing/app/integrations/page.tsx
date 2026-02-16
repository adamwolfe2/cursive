"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { integrations } from "@/lib/integrations-data"
import type { Integration } from "@/lib/integrations-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function connectionBadge(method: Integration["connectionMethod"]) {
  const styles: Record<
    Integration["connectionMethod"],
    { label: string; className: string }
  > = {
    native: { label: "Native", className: "bg-green-100 text-green-800" },
    webhook: { label: "Webhook", className: "bg-blue-100 text-blue-800" },
    zapier: { label: "Zapier", className: "bg-purple-100 text-purple-800" },
    csv: { label: "CSV", className: "bg-gray-100 text-gray-800" },
    "coming-soon": {
      label: "Coming Soon",
      className: "bg-yellow-100 text-yellow-800",
    },
  }

  const s = styles[method]

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  )
}

/** Group integrations by category, preserving order of first appearance. */
function groupByCategory(
  items: Integration[]
): { category: string; items: Integration[] }[] {
  const map = new Map<string, Integration[]>()

  for (const item of items) {
    const existing = map.get(item.category)
    if (existing) {
      existing.push(item)
    } else {
      map.set(item.category, [item])
    }
  }

  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }))
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const grouped = groupByCategory(integrations)

  // Build machine-readable category summary
  const categorySummary = grouped.map(g => ({
    label: `${g.category} (${g.items.length} integrations)`,
    description: g.items.map(i => i.name).join(", "),
  }))

  // Build machine-readable integration list by category
  const integrationLinks = grouped.flatMap(g =>
    g.items.map(i => ({
      label: i.name,
      href: `/integrations/${i.slug}`,
      description: `${i.category} - ${i.connectionMethod} - ${i.description.slice(0, 100)}...`,
    }))
  )

  return (
    <main>
      <HumanView>
        {/* ---- Hero ---- */}
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-5xl mx-auto">
              <span className="text-sm text-[#007AFF] mb-4 block">INTEGRATIONS</span>
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                Seamlessly Sync Data
                <span className="block font-cursive text-6xl lg:text-8xl text-gray-500 mt-2">With Your Stack</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                Connect Cursive to 50+ tools or use our API and webhooks for custom integrations.
              </p>
              <Button size="lg" href="https://cal.com/cursive/30min">View Integrations</Button>
            </motion.div>
          </Container>
        </section>

        {/* ---- Browse All Integrations ---- */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Browse All Integrations
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore every tool that connects with Cursive. Click on an
                integration to see data mapping, setup steps, and workflows.
              </p>
            </div>

            {grouped.map((group) => (
              <div key={group.category} className="mb-16 last:mb-0">
                <h3 className="text-2xl font-light text-gray-900 mb-6 border-b border-gray-200 pb-3">
                  {group.category}
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {group.items.map((integration, idx) => (
                    <motion.div
                      key={integration.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link
                        href={`/integrations/${integration.slug}`}
                        className="block border border-gray-200 rounded-xl p-5 bg-white hover:border-[#007AFF] hover:shadow-lg transition-all group h-full"
                      >
                        <div className="flex items-start justify-between mb-3">
                          {integration.logo.startsWith('/') ? (
                            <img src={integration.logo} alt={integration.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-3xl">{integration.logo}</span>
                          )}
                          {connectionBadge(integration.connectionMethod)}
                        </div>
                        <h4 className="text-base font-medium text-gray-900 mb-1 group-hover:text-[#007AFF] transition-colors">
                          {integration.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">
                          {integration.category}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {integration.description}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </Container>
        </section>

        {/* ---- Integrations Showcase ---- */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <IntegrationsShowcase />
          </Container>
        </section>

        {/* ---- Integration Categories ---- */}
        <section className="py-20 bg-white">
          <Container>
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
              Integration Categories
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { title: 'CRM Platforms', examples: 'Salesforce, HubSpot, Pipedrive, Close' },
                { title: 'Ad Platforms', examples: 'Facebook, Google, LinkedIn, TikTok' },
                { title: 'Email Tools', examples: 'Mailchimp, SendGrid, ActiveCampaign' },
                { title: 'Analytics', examples: 'Google Analytics, Segment, Mixpanel' },
                { title: 'Automation', examples: 'Zapier, Make, n8n, webhooks' },
                { title: 'Data Warehouses', examples: 'Snowflake, BigQuery, Redshift' },
              ].map((category, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600 text-sm">{category.examples}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Learn More About Data Integration
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Best practices for connecting your marketing data platforms
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
              {[
                {
                  title: "CRM Integration Best Practices",
                  description: "Connect your CRM to centralize lead data and improve workflows.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "Marketing Data Platforms",
                  description: "Leverage integrated data platforms to boost campaign ROI and unify customer data.",
                  href: "/blog/data-platforms"
                }
              ].map((resource, i) => (
                <motion.a
                  key={i}
                  href={resource.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="block bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all group"
                >
                  <h3 className="text-lg text-gray-900 mb-2 font-medium group-hover:text-[#007AFF] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 text-[#007AFF] text-sm font-medium flex items-center gap-2">
                    Read article <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.a>
              ))}
            </div>
          </Container>
        </section>

        <DashboardCTA
          headline="Ready to Connect"
          subheadline="Your Stack?"
          description="See how Cursive integrates with your CRM, ad platforms, and marketing tools to create a seamless data flow across your entire GTM stack."
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Cursive Integrations - Connect to 50+ Tools</h1>

          <p className="text-gray-700 mb-6">
            Seamlessly sync Cursive visitor identification and intent data with your existing marketing stack. 50+ integrations including CRMs, ad platforms, email tools, analytics, automation platforms, and data warehouses. Native integrations, webhooks, Zapier, and CSV export available.
          </p>

          <MachineSection title="Integration Categories">
            <MachineList items={[
              "CRM Platforms: Salesforce, HubSpot, Pipedrive, Close, Zoho, Freshsales, Copper",
              "Marketing Automation: Mailchimp, ActiveCampaign, Klaviyo, Brevo, Drip",
              "Sales Engagement: Outreach, SalesLoft, Apollo, Instantly, Smartlead",
              "Communication: Slack, Microsoft Teams, Discord",
              "Automation Platforms: Zapier, Make, n8n, Webhooks",
              "Data & Enrichment: Clearbit, ZoomInfo, Clay",
              "Ad Platforms: Facebook Ads, Google Ads, LinkedIn Ads",
              "Analytics: Google Analytics, Segment, Mixpanel, Amplitude",
              "Spreadsheets: Google Sheets, Airtable, Excel, Notion",
              "Data Warehouses: Snowflake, BigQuery, Redshift",
              "Project Management: Asana, Monday.com, Jira, ClickUp",
              "Customer Messaging: Intercom",
              "Scheduling: Calendly",
              "Forms & Surveys: Typeform",
            ]} />
          </MachineSection>

          <MachineSection title="Connection Methods">
            <MachineList items={[
              "Native: Direct built-in integration (e.g., HubSpot, Slack)",
              "Webhook: Real-time event-driven data push to any endpoint",
              "Zapier: Connect via Zapier for 5,000+ app integrations",
              "CSV: Bulk data export for manual import workflows",
              "API: RESTful API for custom integrations",
            ]} />
          </MachineSection>

          <MachineSection title="Featured Integrations">
            <MachineList items={[
              { label: "Salesforce", href: "/integrations/salesforce", description: "CRM - Webhook - Auto-create leads, update contacts with page views, trigger opportunities from pricing visits" },
              { label: "HubSpot", href: "/integrations/hubspot", description: "CRM - Native - Enrich contacts with visit behavior, create deals from high-intent visitors" },
              { label: "Slack", href: "/integrations/slack", description: "Communication - Native - Real-time visitor alerts in Slack channels" },
              { label: "Zapier", href: "/integrations/zapier", description: "Automation - Native - Connect Cursive to 5,000+ apps" },
              { label: "Google Ads", href: "/integrations/google-ads", description: "Ad Platform - Native - Sync intent audiences for targeted campaigns" },
              { label: "Facebook Ads", href: "/integrations/facebook-ads", description: "Ad Platform - Native - Push custom audiences to Facebook Ad Manager" },
              { label: "Snowflake", href: "/integrations/snowflake", description: "Data Warehouse - Webhook - Stream visitor data to your data warehouse" },
            ]} />
          </MachineSection>

          <MachineSection title="All Integrations">
            <MachineList items={integrationLinks.slice(0, 30)} />
            <p className="text-gray-700 mt-3">
              ...and {Math.max(0, integrationLinks.length - 30)} more integrations. Visit individual integration pages for data mapping, setup steps, and workflow details.
            </p>
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "CRM Integration Best Practices", href: "/blog/crm-integration", description: "Connect your CRM to centralize lead data and improve workflows" },
              { label: "Marketing Data Platforms", href: "/blog/data-platforms", description: "Leverage integrated data platforms to boost campaign ROI" },
              { label: "Platform Overview", href: "/platform", description: "Full visitor identification and lead generation platform" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Book a Demo", href: "https://cal.com/cursive/30min", description: "See how Cursive integrates with your stack" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
