"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function FranchisesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Franchises', url: 'https://meetcursive.com/industries/franchises' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Franchises", href: "/industries/franchises" },
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
                Franchise Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Local marketing at scale for franchise systems. Target franchisees with territory-specific campaigns.
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
              Why Choose Cursive for Franchises
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
                Franchise Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for franchise marketing at scale
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "How to Scale Outbound Without Killing Quality",
                  description: "Build scalable marketing systems across multiple franchise locations.",
                  href: "/blog/scaling-outbound"
                },
                {
                  title: "Guide to Direct Mail Marketing Automation",
                  description: "Automate territory-specific direct mail for all franchisees.",
                  href: "/blog/direct-mail"
                },
                {
                  title: "Omni-Channel Retargeting Strategies",
                  description: "Coordinate campaigns across all locations with consistent messaging.",
                  href: "/blog/retargeting"
                },
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Identify and route leads to the correct franchise location.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Manage multi-location CRM workflows and franchisee access.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage data to improve performance across all franchise locations.",
                  href: "/blog/analytics"
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
                Ready to Scale Your
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Franchise Growth?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Support franchisees with centralized marketing and localized lead generation that drives results.
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
                  <span>Multi-location</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Franchisee support</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Centralized control</span>
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
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR FRANCHISES</h1>
          <p className="text-gray-700 leading-relaxed">
            Marketing platform for franchise systems. Deliver local marketing at scale with territory-specific campaigns, franchisee portals, and centralized management.
          </p>
        </div>

        {/* Franchise Solutions */}
        <MachineSection title="Solutions for Franchises">
          <MachineList items={[
            {
              label: "Territory-Based Targeting",
              description: "Target prospects by ZIP code, radius, or custom territories for each franchisee"
            },
            {
              label: "Franchisee Portal Access",
              description: "Give franchisees access to run local campaigns while maintaining brand standards"
            },
            {
              label: "Local Direct Mail",
              description: "Automate territory-specific direct mail campaigns with local offers"
            },
            {
              label: "Multi-Location Management",
              description: "Manage campaigns across hundreds of locations from centralized dashboard"
            }
          ]} />
        </MachineSection>

        {/* Benefits */}
        <MachineSection title="Benefits">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Centralized Control, Local Execution:</p>
              <p className="text-gray-400">
                Corporate maintains brand control while franchisees execute campaigns tailored to their local market.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Franchisee Support:</p>
              <p className="text-gray-400">
                Provide franchisees with ready-to-use marketing campaigns that drive local leads and revenue.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Performance Visibility:</p>
              <p className="text-gray-400">
                Track performance by location, territory, and franchisee with detailed analytics and reporting.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Scalable Marketing:</p>
              <p className="text-gray-400">
                Build marketing systems that scale with franchise growth without proportional increases in cost.
              </p>
            </div>
          </div>
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <MachineList items={[
            "Multi-location lead generation campaigns",
            "Franchisee recruitment and marketing support",
            "Territory-specific direct mail and email",
            "Local event promotion and grand openings",
            "Corporate campaign distribution to franchisees",
            "Performance tracking and franchisee reporting"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Get Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Discuss franchise marketing needs and pricing"
            },
            {
              label: "Contact Sales",
              href: "https://meetcursive.com/contact",
              description: "Get custom pricing for franchise systems"
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
    title: 'Territory-Based Targeting',
    description: 'Target prospects by ZIP code, radius, or custom territories to support each franchisee location.',
  },
  {
    title: 'Franchisee Portal Access',
    description: 'Give franchisees access to run local campaigns while maintaining corporate brand standards.',
  },
  {
    title: 'Local Direct Mail',
    description: 'Automate territory-specific direct mail campaigns with local offers and branding.',
  },
  {
    title: 'Multi-Location Management',
    description: 'Manage campaigns across hundreds of locations from a centralized dashboard.',
  },
  {
    title: 'Corporate & Local Campaigns',
    description: 'Run national campaigns while allowing franchisees to customize messaging for their market.',
  },
  {
    title: 'Performance Dashboards',
    description: 'Track performance by location, territory, and franchisee with detailed analytics and reporting.',
  },
]
