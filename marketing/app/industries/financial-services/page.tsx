"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function FinancialServicesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Financial Services', url: 'https://meetcursive.com/industries/financial-services' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Financial Services", href: "/industries/financial-services" },
          ]} />
        </div>
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <div className="max-w-5xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[#007AFF] mb-4 block"
              >
                INDUSTRY SOLUTIONS
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-light text-gray-900 mb-6"
              >
                Financial Services Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Custom data strategies for banks & financial institutions. Accelerate prospecting, cut CAC, and prove attribution with verified B2B data.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
                  Schedule a Strategy Call
                </Button>
              </motion.div>
            </div>
          </Container>
        </section>

        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-12 text-center">
              Why Choose Cursive for Financial Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="text-xl text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Industry Insights */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Financial Services Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for financial services marketing
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "B2B Audience Targeting Explained",
                  description: "Target businesses and decision-makers at financial institutions.",
                  href: "/blog/audience-targeting"
                },
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Identify high-net-worth visitors and qualified prospects on your site.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "Guide to Direct Mail Marketing Automation",
                  description: "Deliver compliant direct mail campaigns to qualified prospects.",
                  href: "/blog/direct-mail"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage compliant data to boost financial services campaigns.",
                  href: "/blog/analytics"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Optimize your financial CRM and marketing automation workflows.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "Omni-Channel Retargeting Strategies",
                  description: "Coordinate compliant campaigns across multiple channels.",
                  href: "/blog/retargeting"
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
                    Read article <span>→</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </Container>
        </section>

        <section className="relative py-32 bg-[#F7F9FB] overflow-hidden">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center relative z-10 mb-16"
            >
              <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
                Ready to Acquire More
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                High-Value Clients?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Target high-net-worth individuals and businesses with compliant, verified data and secure campaigns.
              </p>

              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
              >
                Book Your Strategy Call Now
              </Button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Compliance ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure data</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>HNW targeting</span>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-6xl mx-auto"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <DashboardPreview />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F7F9FB] via-[#F7F9FB]/80 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
    </HumanView>

    {/* Machine View - AEO-Optimized */}
    <MachineView>
      <MachineContent>
        {/* Header */}
        <div className="mb-12 pb-6 border-b border-gray-200">
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR FINANCIAL SERVICES</h1>
          <p className="text-gray-700 leading-relaxed">
            Marketing platform for banks, credit unions, wealth management firms, insurance companies, and fintech. Acquire high-net-worth clients and businesses with compliant, verified data.
          </p>
        </div>

        {/* Financial Services Solutions */}
        <MachineSection title="Solutions for Financial Services">
          <MachineList items={[
            {
              label: "Compliance-First Data",
              description: "GDPR, CCPA, and financial services regulations built into every dataset"
            },
            {
              label: "High-Net-Worth Targeting",
              description: "Reach qualified investors, borrowers, and HNW individuals with precision"
            },
            {
              label: "Account-Based Marketing",
              description: "Target businesses and decision-makers at financial institutions"
            },
            {
              label: "Intent Data",
              description: "Identify prospects researching loans, investments, insurance, and banking products"
            }
          ]} />
        </MachineSection>

        {/* Benefits */}
        <MachineSection title="Benefits">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Reduce Customer Acquisition Cost:</p>
              <p className="text-gray-400">
                Replace expensive lead gen services with direct outreach to qualified prospects at a fraction of the cost.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Compliant Marketing:</p>
              <p className="text-gray-400">
                All data sourced and managed in compliance with GDPR, CCPA, and financial services regulations.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Secure Data Handling:</p>
              <p className="text-gray-400">
                Bank-grade security and encryption for all data transfers, storage, and campaign execution.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Omnichannel Campaigns:</p>
              <p className="text-gray-400">
                Reach prospects across email, direct mail, and digital advertising with consistent messaging.
              </p>
            </div>
          </div>
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <MachineList items={[
            "Wealth management client acquisition",
            "Commercial lending prospect targeting",
            "Insurance policy lead generation",
            "Credit card and banking product campaigns",
            "Mortgage and refinance targeting",
            "B2B banking and treasury services"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Get Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Discuss compliant marketing strategies and pricing"
            },
            {
              label: "Contact Sales",
              href: "https://meetcursive.com/contact",
              description: "Get custom pricing for financial institutions"
            }
          ]} />
        </MachineSection>

      </MachineContent>
    </MachineView>
  </>
  )
}

const benefits = [
  {
    title: 'Compliance-First Data',
    description: 'GDPR, CCPA, and financial services regulations baked into every dataset.',
  },
  {
    title: 'Investor & Borrower Targeting',
    description: 'Reach qualified investors, borrowers, and high-net-worth individuals with precision.',
  },
  {
    title: 'Account-Based Marketing',
    description: 'Target businesses and decision-makers at financial institutions and corporations.',
  },
  {
    title: 'Intent Data for Finance',
    description: 'Identify prospects actively researching loans, investments, insurance, and banking products.',
  },
  {
    title: 'Verified Contact Data',
    description: 'Access verified emails, phone numbers, and physical addresses for outreach.',
  },
  {
    title: 'Secure Data Handling',
    description: 'Bank-grade security and encryption for all data transfers and storage.',
  },
]
