"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function AgenciesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Marketing Agencies', url: 'https://meetcursive.com/industries/agencies' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Marketing Agencies", href: "/industries/agencies" },
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
                Marketing Agency Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                White-label data solutions for marketing agencies. Scale your services with verified B2B and B2C data.
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
              Why Choose Cursive for Agencies
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
                Agency Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for scaling your marketing agency
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "How to Scale Outbound Without Killing Quality",
                  description: "Build automated workflows that scale with your client base.",
                  href: "/blog/scaling-outbound"
                },
                {
                  title: "Guide to Direct Mail Marketing Automation",
                  description: "Deliver automated direct mail services to drive better client results.",
                  href: "/blog/direct-mail"
                },
                {
                  title: "Omni-Channel Retargeting Strategies",
                  description: "Coordinate campaigns across multiple channels for consistent messaging.",
                  href: "/blog/retargeting"
                },
                {
                  title: "B2B Audience Targeting Explained",
                  description: "Make B2B targeting simple for your agency clients.",
                  href: "/blog/audience-targeting"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Optimize CRM integrations for multiple client accounts.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage data platforms to boost campaign ROI for clients.",
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
                Agency Services?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Book a free strategy call. We'll show you how to deliver white-label data services that scale with your agency.
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
                  <span>White-label solutions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Volume pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Full API access</span>
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
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
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
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR MARKETING AGENCIES</h1>
          <p className="text-gray-700 leading-relaxed">
            White-label lead generation platform for marketing agencies. Deliver visitor identification, intent audiences, and direct mail campaigns to clients under your own brand.
          </p>
        </div>

        {/* Agency Solutions */}
        <MachineSection title="Solutions for Agencies">
          <MachineList items={[
            {
              label: "White-Label Platform",
              description: "Rebrand Cursive platform with your agency logo, colors, and domain"
            },
            {
              label: "Client Data Isolation",
              description: "Separate workspaces for each client with full data security"
            },
            {
              label: "Revenue Share Program",
              description: "Earn recurring commission on client usage"
            },
            {
              label: "Agency Dashboard",
              description: "Manage all clients from single admin panel"
            }
          ]} />
        </MachineSection>

        {/* Benefits */}
        <MachineSection title="Benefits">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Expand Service Offerings:</p>
              <p className="text-gray-400">
                Add visitor identification, intent audiences, and direct mail to your service menu without building technology in-house.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Increase Client Retention:</p>
              <p className="text-gray-400">
                Provide measurable results with lead generation and campaign automation that clients can't get elsewhere.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Generate Recurring Revenue:</p>
              <p className="text-gray-400">
                Monthly platform fees create predictable, scalable revenue streams alongside your service work.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Custom Reporting:</p>
              <p className="text-gray-400">
                White-label reports and dashboards that showcase results and prove ROI to your clients.
              </p>
            </div>
          </div>
        </MachineSection>

        {/* Pricing */}
        <MachineSection title="Agency Pricing">
          <p className="text-gray-700 mb-4">
            Custom pricing for agencies based on number of clients and usage volume. Typical agency partnerships include:
          </p>
          <MachineList items={[
            "White-label platform access",
            "Revenue share on client usage",
            "Dedicated agency support",
            "Co-marketing opportunities"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Partner with Cursive">
          <MachineList items={[
            {
              label: "Schedule Partnership Call",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Discuss white-label options and pricing"
            },
            {
              label: "Contact Sales",
              href: "https://meetcursive.com/contact",
              description: "Get custom agency pricing"
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
    title: 'White-Label Solutions',
    description: 'Rebrand our platform as your own and deliver data services under your agency brand.',
  },
  {
    title: 'Client Campaign Management',
    description: 'Manage multiple client campaigns from a single dashboard with isolated data and reporting.',
  },
  {
    title: 'Multi-Client Workspaces',
    description: 'Separate workspaces for each client with permissions, billing, and data security.',
  },
  {
    title: 'Agency Pricing Tiers',
    description: 'Volume-based pricing that scales with your agency and delivers better margins on client work.',
  },
  {
    title: 'API Access',
    description: 'Full API access to integrate data services into your existing tech stack and workflows.',
  },
  {
    title: 'Custom Reporting',
    description: 'White-label reports and dashboards that showcase results and prove ROI to your clients.',
  },
]
