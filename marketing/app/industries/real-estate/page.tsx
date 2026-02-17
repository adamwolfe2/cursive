"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function RealEstatePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Real Estate', url: 'https://www.meetcursive.com/industries/real-estate' },
      ])} />
      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Real Estate", href: "/industries/real-estate" },
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
                Real Estate Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Identify prospective buyers and sellers visiting your listings. Automate direct mail campaigns, build targeted audiences, and convert more leads.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button size="lg" href="https://cal.com/cursive/30min">
                  Schedule a Strategy Call
                </Button>
              </motion.div>
            </div>
          </Container>
        </section>

        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-12 text-center">
              Why Choose Cursive for Real Estate
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
                Real Estate Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for real estate marketing and lead generation
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Guide to Direct Mail Marketing Automation",
                  description: "Automate just-listed, just-sold, and farming campaigns with triggered direct mail.",
                  href: "/blog/direct-mail"
                },
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Turn anonymous listing visitors into identified buyer and seller leads.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "Omni-Channel Retargeting Strategies",
                  description: "Coordinate campaigns across digital ads, email, and direct mail for real estate.",
                  href: "/blog/retargeting"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Sync lead data with your real estate CRM for automated follow-up.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Use data-driven targeting to reach buyers and sellers in your market.",
                  href: "/blog/analytics"
                },
                {
                  title: "How to Scale Outbound Without Killing Quality",
                  description: "Scale your prospecting efforts while maintaining personalized outreach.",
                  href: "/blog/scaling-outbound"
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
                Ready to Generate More
              </h2>
              <p className="font-cursive text-5xl lg:text-6xl text-gray-500 mb-6">
                Real Estate Leads?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Book a free strategy call. We'll show you how to identify listing visitors and automate campaigns that convert.
              </p>

              <Button
                size="lg"
                href="https://cal.com/cursive/30min"
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
                  <span>Direct mail automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Visitor identification</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>CRM integration</span>
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
          <h1 className="text-2xl text-gray-900 font-bold mb-4">REAL ESTATE MARKETING SOLUTIONS</h1>
          <p className="text-gray-700 leading-relaxed">
            Lead generation and direct mail automation for real estate professionals. Identify prospective buyers and sellers visiting your listings, automate farming campaigns, and convert more leads with targeted outreach.
          </p>
        </div>

        {/* Overview */}
        <MachineSection title="Solution Overview">
          <p className="text-gray-700 mb-4">
            Cursive helps real estate agents, teams, and brokerages identify website visitors browsing listings, automate direct mail campaigns for farming and prospecting, and build targeted audiences of likely buyers and sellers. Turn anonymous listing traffic into actionable leads and scale your marketing without administrative overhead.
          </p>
        </MachineSection>

        {/* Key Benefits */}
        <MachineSection title="Why Choose Cursive for Real Estate">
          <MachineList items={[
            {
              label: "Listing Visitor Identification",
              description: "Identify who is browsing your listings online and match them to verified contact information"
            },
            {
              label: "Automated Direct Mail",
              description: "Trigger just-listed, just-sold, and farming postcards automatically based on events and schedules"
            },
            {
              label: "Neighborhood Farming",
              description: "Build targeted audiences by zip code, neighborhood, and property characteristics for consistent prospecting"
            },
            {
              label: "Buyer Intent Signals",
              description: "Identify prospects actively searching for properties in your market with buying intent data"
            },
            {
              label: "CRM Integration",
              description: "Sync identified leads directly to your real estate CRM for automated follow-up sequences"
            },
            {
              label: "Multi-Channel Campaigns",
              description: "Coordinate outreach across direct mail, email, digital ads, and social media for maximum reach"
            }
          ]} />
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Just-Listed / Just-Sold Campaigns:</p>
              <p className="text-gray-400">Automatically trigger postcards to surrounding neighborhoods when new listings go live or close.</p>
            </div>
            <div>
              <p className="text-white mb-2">Geographic Farming:</p>
              <p className="text-gray-400">Maintain consistent presence in target zip codes with automated monthly mailers personalized with local market data.</p>
            </div>
            <div>
              <p className="text-white mb-2">Open House Follow-Up:</p>
              <p className="text-gray-400">Identify visitors to your listing pages before and after open houses and trigger personalized follow-up.</p>
            </div>
            <div>
              <p className="text-white mb-2">Expired Listing Outreach:</p>
              <p className="text-gray-400">Target homeowners with expired listings using personalized direct mail and digital campaigns.</p>
            </div>
          </div>
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Getting Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/cursive/30min",
              description: "Book a free consultation for your real estate marketing needs"
            },
            {
              label: "Website",
              href: "https://www.meetcursive.com"
            },
            {
              label: "Industries",
              href: "https://www.meetcursive.com/industries"
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
    title: 'Listing Visitor Identification',
    description: 'Identify who is browsing your listings online and match them to verified contact information for follow-up.',
  },
  {
    title: 'Automated Direct Mail',
    description: 'Trigger just-listed, just-sold, and farming postcards automatically based on events and schedules.',
  },
  {
    title: 'Neighborhood Farming',
    description: 'Build targeted audiences by zip code, neighborhood, and property characteristics for consistent prospecting.',
  },
  {
    title: 'Buyer Intent Signals',
    description: 'Identify prospects actively searching for properties in your market with buying intent data.',
  },
  {
    title: 'CRM Integration',
    description: 'Sync identified leads directly to your real estate CRM for automated follow-up sequences.',
  },
  {
    title: 'Multi-Channel Campaigns',
    description: 'Coordinate outreach across direct mail, email, digital ads, and social media for maximum reach.',
  },
]
