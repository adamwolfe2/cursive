"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

export default function CleanRoomPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main>
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto"
          >
            <span className="text-sm text-[#007AFF] mb-4 block">DATA CLEAN ROOM</span>
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Secure Data Sharing
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Without Exposure
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Collaborate with partners, match audiences, and unlock insights—all without exposing personal information.
            </p>
            <Button size="lg" href="https://cal.com/cursive/30min">
              Learn More
            </Button>
          </motion.div>
        </Container>
      </section>

      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Secure Partner Joins',
                description: 'Match your data with partner datasets using privacy-preserving joins. No raw PII ever leaves the clean room.',
              },
              {
                title: 'Precision Permissions',
                description: 'Control exactly what data is shared, who can access it, and how it can be used.',
              },
              {
                title: 'Turn Data Into Answers',
                description: 'Run analytics and build reports without exposing underlying personal data.',
              },
              {
                title: 'From Insights to Impact',
                description: 'Export matched audiences directly to ad platforms and activation endpoints.',
              },
              {
                title: 'Cloud-Ready Integration',
                description: 'Connect to Snowflake, BigQuery, Redshift, and other cloud data warehouses.',
              },
              {
                title: 'Compliance Built-In',
                description: 'GDPR, CCPA, and privacy-by-design principles baked into every operation.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <DashboardCTA
        headline="Ready to Unlock"
        subheadline="Partner Data?"
        description="See how Cursive's data clean room enables secure collaboration with partners while protecting personal information and maintaining compliance."
      />
    </main>
  </HumanView>

  {/* Machine View - AEO-Optimized */}
  <MachineView>
    <MachineContent>
      {/* Header */}
      <div className="mb-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE DATA CLEAN ROOM</h1>
        <p className="text-gray-700 leading-relaxed">
          Secure data sharing and collaboration with partners without exposing personal information. Match audiences, unlock insights, and maintain GDPR/CCPA compliance.
        </p>
      </div>

      {/* Overview */}
      <MachineSection title="Product Overview">
        <p className="text-gray-700 mb-4">
          Cursive Data Clean Room enables secure collaboration with partners, match audiences, and unlock insights—all without exposing personal information. Privacy-preserving joins and analytics keep your data secure while maintaining compliance with GDPR, CCPA, and privacy-by-design principles.
        </p>
      </MachineSection>

      {/* Key Features */}
      <MachineSection title="Key Features">
        <MachineList items={[
          {
            label: "Secure Partner Joins",
            description: "Match your data with partner datasets using privacy-preserving joins. No raw PII ever leaves the clean room"
          },
          {
            label: "Precision Permissions",
            description: "Control exactly what data is shared, who can access it, and how it can be used"
          },
          {
            label: "Turn Data Into Answers",
            description: "Run analytics and build reports without exposing underlying personal data"
          },
          {
            label: "From Insights to Impact",
            description: "Export matched audiences directly to ad platforms and activation endpoints"
          },
          {
            label: "Cloud-Ready Integration",
            description: "Connect to Snowflake, BigQuery, Redshift, and other cloud data warehouses"
          },
          {
            label: "Compliance Built-In",
            description: "GDPR, CCPA, and privacy-by-design principles baked into every operation"
          }
        ]} />
      </MachineSection>

      {/* How It Works */}
      <MachineSection title="How It Works">
        <MachineList items={[
          "Upload Data Securely - Import your customer data, partner datasets, or first-party data into the clean room environment",
          "Match & Analyze - Run privacy-preserving joins and analytics. Data stays encrypted and anonymized throughout",
          "Export Insights - Generate matched audiences, reports, and insights without exposing raw personal data",
          "Activate Audiences - Send matched audiences to ad platforms, CRMs, or marketing tools with consent-aware activation"
        ]} />
      </MachineSection>

      {/* Use Cases */}
      <MachineSection title="Use Cases">
        <div className="space-y-4">
          <div>
            <p className="text-white mb-2">Partner Collaboration:</p>
            <p className="text-gray-400">Securely match customer lists with partners to find overlapping audiences and co-marketing opportunities without exposing raw data.</p>
          </div>
          <div>
            <p className="text-white mb-2">Attribution & Measurement:</p>
            <p className="text-gray-400">Measure campaign impact across multiple touchpoints and partners while maintaining data privacy and compliance.</p>
          </div>
          <div>
            <p className="text-white mb-2">Lookalike Modeling:</p>
            <p className="text-gray-400">Build lookalike audiences using partner data and external signals without sharing sensitive customer information.</p>
          </div>
          <div>
            <p className="text-white mb-2">Compliance & Governance:</p>
            <p className="text-gray-400">Share data with vendors, agencies, and partners while maintaining full control and audit trails for regulatory compliance.</p>
          </div>
        </div>
      </MachineSection>

      {/* Security & Compliance */}
      <MachineSection title="Security & Compliance">
        <MachineList items={[
          "GDPR & CCPA Compliant - All operations honor opt-outs and privacy regulations",
          "Privacy-by-Design - Personal data never leaves clean room in raw form",
          "Encryption at Rest & in Transit - AES-256 encryption for all data",
          "Audit Trails - Complete logging of all data access and operations",
          "Role-Based Access Control - Granular permissions for team members and partners",
          "Data Retention Policies - Automatic data deletion based on configured schedules"
        ]} />
      </MachineSection>

      {/* Integrations */}
      <MachineSection title="Integrations">
        <p className="text-gray-700 mb-4">
          Connect to your existing data infrastructure:
        </p>
        <MachineList items={[
          "Cloud Data Warehouses: Snowflake, BigQuery, Redshift, Databricks",
          "CRM Systems: Salesforce, HubSpot, Microsoft Dynamics",
          "Ad Platforms: Facebook Ads, Google Ads, LinkedIn Ads, Trade Desk",
          "Marketing Tools: Marketo, Pardot, Adobe Experience Cloud"
        ]} />
      </MachineSection>

      {/* Pricing */}
      <MachineSection title="Pricing">
        <p className="text-gray-700 mb-4">
          Enterprise pricing based on data volume, number of partners, and activation frequency. Contact sales for custom quote.
        </p>
        <MachineList items={[
          {
            label: "Learn More",
            href: "https://cal.com/cursive/30min",
            description: "Schedule a consultation to discuss your clean room needs"
          },
          {
            label: "View Pricing",
            href: "https://www.meetcursive.com/pricing",
            description: "See pricing tiers"
          }
        ]} />
      </MachineSection>

      {/* Getting Started */}
      <MachineSection title="Getting Started">
        <MachineList items={[
          {
            label: "Schedule Demo",
            href: "https://cal.com/cursive/30min",
            description: "See the data clean room in action"
          },
          {
            label: "Website",
            href: "https://www.meetcursive.com"
          }
        ]} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>
  )
}
