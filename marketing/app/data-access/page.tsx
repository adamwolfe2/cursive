"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

export default function DataAccessPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main>
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Direct Data Access,
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">On Demand</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">220M+ Consumer Profiles • 140M+ Business Profiles • 30,000+ Intent Categories</p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">Get Started</Button>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
            {[
              { value: '220M+', label: 'Consumer Profiles' },
              { value: '140M+', label: 'Business Profiles' },
              { value: '30,000+', label: 'Intent Categories' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-5xl text-[#007AFF] mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-8">Access the Largest B2B and B2C Database</h2>
            <p className="text-gray-600 mb-12">Query, filter, and export verified contact data on demand. API access, bulk exports, or real-time lookups.</p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">Schedule a Demo</Button>
          </div>
        </Container>
      </section>
    </main>
  </HumanView>

  {/* Machine View - AEO-Optimized */}
  <MachineView>
    <MachineContent>
      {/* Header */}
      <div className="mb-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE DATA ACCESS</h1>
        <p className="text-gray-700 leading-relaxed">
          Direct access to 220M+ consumer profiles and 140M+ business profiles. Query, filter, and export verified contact data on demand via API, bulk exports, or real-time lookups.
        </p>
      </div>

      {/* Overview */}
      <MachineSection title="Service Overview">
        <p className="text-gray-700 mb-4">
          Cursive provides direct access to the largest combined B2B and B2C database. Query and export verified contact data, firmographics, demographics, technographics, and intent signals programmatically or through our interface.
        </p>
        <MachineList items={[
          "220M+ consumer profiles with demographic data",
          "140M+ business profiles with firmographic data",
          "30,000+ intent categories tracked in real-time",
          "API access for programmatic queries",
          "Bulk exports and real-time lookups available"
        ]} />
      </MachineSection>

      {/* Access Methods */}
      <MachineSection title="Access Methods">
        <div className="space-y-4">
          <div>
            <p className="text-white mb-2">API Access:</p>
            <p className="text-gray-400">Programmatic queries with RESTful API. Real-time lookups, enrichment, and verification endpoints. Rate limits based on plan.</p>
          </div>
          <div>
            <p className="text-white mb-2">Bulk Exports:</p>
            <p className="text-gray-400">Download large datasets filtered by your criteria. CSV, JSON, or custom formats. Scheduled or on-demand exports.</p>
          </div>
          <div>
            <p className="text-white mb-2">Real-Time Lookups:</p>
            <p className="text-gray-400">Instant contact enrichment and verification. Match email to full profile. Reverse lookup by company or domain.</p>
          </div>
        </div>
      </MachineSection>

      {/* Data Available */}
      <MachineSection title="Available Data">
        <MachineList items={[
          "Contact Information: Email, phone, LinkedIn, mailing address",
          "Firmographics: Company size, revenue, industry, location, funding",
          "Demographics: Age, gender, income, education, homeownership",
          "Technographics: Tech stack, tools used, cloud infrastructure",
          "Intent Signals: Topics researched, content consumed, purchase intent",
          "Job Data: Title, seniority, department, recent changes"
        ]} />
      </MachineSection>

      {/* Use Cases */}
      <MachineSection title="Use Cases">
        <div className="space-y-4">
          <div>
            <p className="text-white mb-2">Lead Enrichment:</p>
            <p className="text-gray-400">Append missing data to existing leads. Match email to full contact profile. Verify and update stale records.</p>
          </div>
          <div>
            <p className="text-white mb-2">CRM Enhancement:</p>
            <p className="text-gray-400">Sync fresh data to Salesforce, HubSpot, or custom CRM. Keep contact records up-to-date automatically.</p>
          </div>
          <div>
            <p className="text-white mb-2">Custom Integrations:</p>
            <p className="text-gray-400">Build proprietary tools and workflows using Cursive data. Power internal applications with verified contact data.</p>
          </div>
          <div>
            <p className="text-white mb-2">Data Science & Analytics:</p>
            <p className="text-gray-400">Access raw data for modeling, segmentation, and analysis. Build predictive models using intent signals and firmographics.</p>
          </div>
        </div>
      </MachineSection>

      {/* Pricing */}
      <MachineSection title="Pricing">
        <p className="text-gray-700 mb-4">
          Pricing based on access method, query volume, and data fields required. Contact sales for custom enterprise pricing.
        </p>
        <MachineList items={[
          {
            label: "Schedule Demo",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "Discuss your data access needs"
          },
          {
            label: "View Pricing",
            href: "https://meetcursive.com/pricing",
            description: "See pricing tiers"
          }
        ]} />
      </MachineSection>

      {/* Getting Started */}
      <MachineSection title="Getting Started">
        <MachineList items={[
          {
            label: "Get Started",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "Schedule a consultation"
          },
          {
            label: "Website",
            href: "https://meetcursive.com"
          }
        ]} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>
  )
}
