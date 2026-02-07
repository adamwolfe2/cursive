"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import Link from "next/link"
import { Check, Shield, Database, Zap, FileText } from "lucide-react"

export default function DataAccessPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/data-access#product",
        "name": "Cursive Data Access",
        "description": "Direct access to 220M+ consumer profiles and 140M+ business profiles. Query, filter, and export verified contact data on demand via API, bulk exports, or real-time lookups.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://meetcursive.com/data-access",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "category": "Data Access Platform"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://meetcursive.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Data Access",
            "item": "https://meetcursive.com/data-access"
          }
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Human View */}
      <HumanView>
        <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", href: "/" },
          { name: "Data Access", href: "/data-access" },
        ]} />
      </div>
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
      {/* Data Sources Section */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">The Most Comprehensive B2B and B2C Database Available</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Cursive aggregates data from hundreds of verified sources to build the largest combined business and consumer database. Every record is validated through multiple verification methods before it reaches you.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-xl p-8 border border-gray-200">
                <Database className="w-10 h-10 text-[#007AFF] mb-4" />
                <h3 className="text-xl font-light text-gray-900 mb-3">220M+ Consumer Profiles</h3>
                <p className="text-gray-600 text-sm mb-4">Our consumer database covers over 220 million individuals across the United States with detailed demographic, lifestyle, and behavioral data points.</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Verified email addresses and phone numbers</li>
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Age, income, education, and homeownership data</li>
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Purchase behavior and brand affinities</li>
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Lifestyle interests and online activity</li>
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-8 border border-gray-200">
                <Database className="w-10 h-10 text-[#007AFF] mb-4" />
                <h3 className="text-xl font-light text-gray-900 mb-3">140M+ Business Profiles</h3>
                <p className="text-gray-600 text-sm mb-4">Our business database includes over 140 million professional profiles with firmographic data, technographic insights, and real-time intent signals.</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Job title, seniority, and department information</li>
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Company revenue, employee count, and funding data</li>
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> Technology stack and tool usage</li>
                  <li className="flex items-start gap-2 text-gray-600 text-sm"><Check className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" /> 30,000+ intent categories tracked in real-time</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* Data Quality Methodology */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">Data Quality Methodology</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Data is only valuable when it is accurate. Our multi-step verification process ensures every record meets our 95%+ accuracy standard before it is delivered to you.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#007AFF] text-2xl font-light">1</span>
                </div>
                <h3 className="text-lg font-light text-gray-900 mb-2">Multi-Source Aggregation</h3>
                <p className="text-gray-600 text-sm">We aggregate data from hundreds of public and licensed sources, cross-referencing each record against multiple databases to ensure completeness and reduce duplicates.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#007AFF] text-2xl font-light">2</span>
                </div>
                <h3 className="text-lg font-light text-gray-900 mb-2">Real-Time Verification</h3>
                <p className="text-gray-600 text-sm">Every email address, phone number, and company record undergoes real-time validation at the point of delivery. This is not batch verification from last month. It happens when you request the data.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#007AFF] text-2xl font-light">3</span>
                </div>
                <h3 className="text-lg font-light text-gray-900 mb-2">Bounce Replacement Guarantee</h3>
                <p className="text-gray-600 text-sm">If any delivered email address bounces, we replace it for free. We guarantee 95%+ email deliverability across all plans and data exports, so you never pay for bad data.</p>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">How Teams Access Cursive Data</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Whether you need a handful of records or millions, Cursive provides flexible access methods to fit your workflow.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-xl p-8 border border-gray-200">
                <Zap className="w-10 h-10 text-[#007AFF] mb-4" />
                <h3 className="text-xl font-light text-gray-900 mb-3">API Access</h3>
                <p className="text-gray-600 text-sm mb-3">Programmatic queries with our RESTful API. Build data enrichment into your product, power internal tools, or sync directly to your CRM. Includes real-time lookups, contact enrichment endpoints, and batch processing.</p>
                <p className="text-gray-500 text-xs">Available on Pipeline plan and above. <Link href="/pricing" className="text-[#007AFF] hover:underline">See pricing</Link></p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-8 border border-gray-200">
                <FileText className="w-10 h-10 text-[#007AFF] mb-4" />
                <h3 className="text-xl font-light text-gray-900 mb-3">Bulk Exports</h3>
                <p className="text-gray-600 text-sm mb-3">Download large datasets filtered by your targeting criteria. Export in CSV, JSON, or custom formats. Schedule recurring exports or run them on demand. Perfect for loading into your CRM, data warehouse, or marketing automation platform.</p>
                <p className="text-gray-500 text-xs">Available on all plans. <Link href="/marketplace" className="text-[#007AFF] hover:underline">Try the marketplace</Link></p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white rounded-xl p-8 border border-gray-200">
                <Database className="w-10 h-10 text-[#007AFF] mb-4" />
                <h3 className="text-xl font-light text-gray-900 mb-3">Real-Time Lookups</h3>
                <p className="text-gray-600 text-sm mb-3">Instant contact enrichment and verification. Match an email to a full profile, perform reverse lookups by company or domain, and verify contact information in real-time. Ideal for form enrichment, lead scoring, and sales workflows.</p>
                <p className="text-gray-500 text-xs">Available on Outbound and Pipeline. <Link href="/contact" className="text-[#007AFF] hover:underline">Contact sales</Link></p>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Shield className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">Compliance and Security</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Cursive takes data privacy and security seriously. Our data practices comply with all major regulatory frameworks, and our infrastructure meets enterprise-grade security standards.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 text-center">
                <h3 className="text-gray-900 mb-2 font-medium">GDPR Compliant</h3>
                <p className="text-gray-600 text-sm">Full compliance with the General Data Protection Regulation for EU data subjects, including right-to-access and right-to-erasure.</p>
              </div>
              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 text-center">
                <h3 className="text-gray-900 mb-2 font-medium">CCPA Compliant</h3>
                <p className="text-gray-600 text-sm">Full compliance with the California Consumer Privacy Act, including consumer opt-out rights and data deletion requests.</p>
              </div>
              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 text-center">
                <h3 className="text-gray-900 mb-2 font-medium">SOC 2 Type II</h3>
                <p className="text-gray-600 text-sm">Our infrastructure and processes have been audited and certified for security, availability, and confidentiality controls.</p>
              </div>
              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 text-center">
                <h3 className="text-gray-900 mb-2 font-medium">CAN-SPAM Compliant</h3>
                <p className="text-gray-600 text-sm">All outreach campaigns managed through Cursive comply with CAN-SPAM requirements, including opt-out handling and sender identification.</p>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm mt-8">
              Questions about data privacy or compliance? <Link href="/contact" className="text-[#007AFF] hover:underline">Contact our team</Link> or review our <Link href="/privacy" className="text-[#007AFF] hover:underline">privacy policy</Link>.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <DashboardCTA
        headline="Ready to Access"
        subheadline="Better Data?"
        description="Schedule a demo and we'll show you exactly how Cursive data can power your pipeline."
      />
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

      {/* Data Quality Methodology */}
      <MachineSection title="Data Quality Methodology">
        <p className="text-gray-700 mb-4">
          Cursive uses a multi-step verification process to ensure every record meets a 95%+ accuracy standard before delivery. Our data quality methodology includes three core steps.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 mb-2">Step 1: Multi-Source Aggregation</p>
            <p className="text-gray-600">Data is aggregated from hundreds of public and licensed sources. Each record is cross-referenced against multiple databases to ensure completeness and reduce duplicates.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Step 2: Real-Time Verification</p>
            <p className="text-gray-600">Every email address, phone number, and company record undergoes real-time validation at the point of delivery. Verification happens when you request data, not in monthly batches.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Step 3: Bounce Replacement Guarantee</p>
            <p className="text-gray-600">If any delivered email address bounces, Cursive replaces it at no charge. 95%+ email deliverability is guaranteed across all plans and data exports.</p>
          </div>
        </div>
      </MachineSection>

      {/* Compliance */}
      <MachineSection title="Compliance and Security">
        <p className="text-gray-700 mb-4">
          Cursive data practices comply with all major regulatory frameworks. Infrastructure meets enterprise-grade security standards.
        </p>
        <MachineList items={[
          "GDPR Compliant: Full compliance with the General Data Protection Regulation for EU data subjects, including right-to-access and right-to-erasure",
          "CCPA Compliant: Full compliance with the California Consumer Privacy Act, including consumer opt-out rights and data deletion requests",
          "SOC 2 Type II: Infrastructure and processes audited and certified for security, availability, and confidentiality controls",
          "CAN-SPAM Compliant: All outreach campaigns comply with CAN-SPAM requirements including opt-out handling and sender identification"
        ]} />
      </MachineSection>

      {/* Pricing */}
      <MachineSection title="Pricing">
        <p className="text-gray-700 mb-4">
          Pricing based on access method, query volume, and data fields required. Self-serve marketplace credits start at $99 for 100 credits. Done-for-you data plans start at $800/month (annual). Contact sales for custom enterprise pricing.
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
            description: "See pricing tiers and plans"
          },
          {
            label: "Try the Marketplace",
            href: "https://meetcursive.com/marketplace",
            description: "Self-serve search and export with 100 free credits"
          }
        ]} />
      </MachineSection>

      {/* Related Resources */}
      <MachineSection title="Related Resources">
        <MachineList items={[
          {
            label: "Custom Audiences",
            href: "https://meetcursive.com/custom-audiences",
            description: "Build targeted audiences using Cursive data filters"
          },
          {
            label: "Visitor Identification",
            href: "https://meetcursive.com/visitor-identification",
            description: "Identify anonymous website visitors with the Cursive pixel"
          },
          {
            label: "Intent Audiences",
            href: "https://meetcursive.com/intent-audiences",
            description: "Target contacts based on real-time purchase intent signals"
          },
          {
            label: "Privacy Policy",
            href: "https://meetcursive.com/privacy",
            description: "Learn how Cursive handles and protects data"
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
            label: "Free Audit",
            href: "https://meetcursive.com/free-audit",
            description: "Get a free analysis of your last 100 website visitors"
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
