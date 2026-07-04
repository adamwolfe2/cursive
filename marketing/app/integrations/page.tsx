"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import {
  ArrowRight, Database, Megaphone, Mail, BarChart3,
  Workflow, Server, type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { integrations } from "@/lib/integrations-data"
import type { Integration } from "@/lib/integrations-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function IconChip({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

function connectionBadge(method: Integration["connectionMethod"]) {
  const styles: Record<
    Integration["connectionMethod"],
    { label: string; className: string }
  > = {
    native: { label: "Native", className: "bg-green-100 text-green-800" },
    webhook: { label: "Webhook", className: "bg-primary/10 text-primary" },
    zapier: { label: "Zapier", className: "bg-primary/10 text-primary" },
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

const categoryCards: Array<{ icon: LucideIcon; title: string; examples: string }> = [
  { icon: Database, title: "CRM Platforms", examples: "Salesforce, HubSpot, Pipedrive, Close" },
  { icon: Megaphone, title: "Ad Platforms", examples: "Facebook, Google, LinkedIn, TikTok" },
  { icon: Mail, title: "Email Tools", examples: "Mailchimp, SendGrid, ActiveCampaign" },
  { icon: BarChart3, title: "Analytics", examples: "Google Analytics, Segment, Mixpanel" },
  { icon: Workflow, title: "Automation", examples: "Zapier, Make, n8n, webhooks" },
  { icon: Server, title: "Data Warehouses", examples: "Snowflake, BigQuery, Redshift" },
]

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const grouped = groupByCategory(integrations)

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Integrations", href: "/integrations" },
          ]} />
        </div>

        {/* ---- Hero ---- */}
        <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-white overflow-hidden">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                Integrations
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                Seamlessly Sync Data
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  With Your Stack
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                Connect Cursive to 50+ tools, or use our API and webhooks for custom flows. Verified
                contacts and intent data land in the tools your team already runs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Book a Call
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* ---- Browse All Integrations ---- */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Browse All"
              script="Integrations"
              sub="Every tool that connects with Cursive. Click one to see data mapping, setup steps, and workflows."
            />

            {grouped.map((group) => (
              <div key={group.category} className="mb-16 last:mb-0">
                <h3 className="text-2xl font-light text-gray-900 mb-6 border-b border-gray-200 pb-3">
                  {group.category}
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {group.items.map((integration, idx) => (
                    <motion.div
                      key={integration.slug}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ delay: idx * 0.03, duration: 0.4, ease: EASE }}
                    >
                      <Link
                        href={`/integrations/${integration.slug}`}
                        className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-primary transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          {integration.logo.startsWith('/') ? (
                            <img src={integration.logo} alt={integration.name} className="w-9 h-9 object-contain" />
                          ) : (
                            <span className="text-3xl leading-none">{integration.logo}</span>
                          )}
                          {connectionBadge(integration.connectionMethod)}
                        </div>
                        <h4 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                          {integration.name}
                        </h4>
                        <p className="mt-1 text-xs text-gray-400">
                          {integration.category}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
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
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <IntegrationsShowcase />
          </Container>
        </section>

        {/* ---- Integration Categories ---- */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Integration"
              script="Categories"
              sub="From CRMs to data warehouses, Cursive plugs into every layer of your GTM stack."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {categoryCards.map((category, i) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={category.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{category.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{category.examples}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ---- Related Resources ---- */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Learn More About"
              script="Data Integration"
              sub="Best practices for connecting your marketing data platforms."
            />
            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  title: "CRM Integration Best Practices",
                  description: "Connect your CRM to centralize lead data and improve workflows.",
                  href: "/blog/crm-integration",
                },
                {
                  title: "Marketing Data Platforms",
                  description: "Leverage integrated data platforms to boost campaign ROI and unify customer data.",
                  href: "/blog/data-platforms",
                },
              ].map((resource, i) => (
                <motion.div
                  key={resource.href}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                >
                  <Link
                    href={resource.href}
                    className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg hover:border-primary transition-all group"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      {resource.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Read article <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        <DashboardCTA
          headline="Ready to Connect"
          subheadline="Your Stack?"
          description="See how Cursive syncs verified contacts and intent data into your CRM, ad platforms, and marketing tools. Plans from $97/mo, month-to-month."
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h2 className="text-2xl font-semibold mb-4">Cursive Integrations - Connect to 50+ Tools</h2>

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
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "See how Cursive integrates with your stack" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
