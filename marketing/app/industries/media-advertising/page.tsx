"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function MediaAdvertisingPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Media & Advertising', url: 'https://meetcursive.com/industries/media-advertising' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Media & Advertising", href: "/industries/media-advertising" },
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
                Media & Advertising Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Audience data for publishers, media companies, and advertising agencies. Build premium audiences and maximize ad inventory value.
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
              Why Choose Cursive for Media & Advertising
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
                Media & Advertising Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for media companies and advertising agencies
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Track and identify visitors to prove campaign attribution for clients.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "How to Scale Outbound Without Killing Quality",
                  description: "Build scalable campaign workflows for multiple advertising clients.",
                  href: "/blog/scaling-outbound"
                },
                {
                  title: "Omni-Channel Retargeting Strategies",
                  description: "Coordinate campaigns across channels for consistent client results.",
                  href: "/blog/retargeting"
                },
                {
                  title: "B2B Audience Targeting Explained",
                  description: "Build premium B2B audience segments for advertising clients.",
                  href: "/blog/audience-targeting"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Integrate campaign data with client CRMs for better reporting.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage audience data to maximize campaign performance.",
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
                Ready to Prove Your
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Campaign ROI?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Track website visitors back to campaigns and prove attribution for your advertising clients.
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
                  <span>Attribution tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Client reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Campaign proof</span>
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
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR MEDIA & ADVERTISING</h1>
          <p className="text-gray-700 leading-relaxed">
            Audience data platform for publishers, media companies, and advertising agencies. Build premium audiences, maximize ad inventory value, and prove campaign attribution.
          </p>
        </div>

        {/* Media & Advertising Solutions */}
        <MachineSection title="Solutions for Media & Advertising">
          <MachineList items={[
            {
              label: "Premium Audience Data",
              description: "Access high-value audience segments to increase CPMs and attract advertisers"
            },
            {
              label: "First-Party Data Enrichment",
              description: "Enhance first-party data with demographic, psychographic, behavioral insights"
            },
            {
              label: "Advertiser Targeting",
              description: "Build custom audiences that match advertiser requirements and maximize fill rates"
            },
            {
              label: "Cross-Platform Attribution",
              description: "Track audience engagement across channels and prove media property value"
            }
          ]} />
        </MachineSection>

        {/* Benefits */}
        <MachineSection title="Benefits">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Increase Ad Revenue:</p>
              <p className="text-gray-400">
                Premium audience data commands higher CPMs and attracts more advertisers to your inventory.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Prove Campaign Attribution:</p>
              <p className="text-gray-400">
                Track website visitors back to campaigns and demonstrate clear ROI for advertising clients.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Programmatic Integration:</p>
              <p className="text-gray-400">
                Seamlessly integrate audience data with programmatic platforms and ad servers for real-time targeting.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Brand Safety & Compliance:</p>
              <p className="text-gray-400">
                Ensure advertiser confidence with verified, compliant audience data and full transparency.
              </p>
            </div>
          </div>
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <MachineList items={[
            "Publisher audience monetization",
            "Programmatic advertising optimization",
            "Advertiser campaign targeting and reporting",
            "Media property valuation and sales",
            "Cross-platform attribution tracking",
            "Client campaign performance reporting"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Get Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Discuss audience data and attribution needs"
            },
            {
              label: "Contact Sales",
              href: "https://meetcursive.com/contact",
              description: "Get custom pricing for media and advertising companies"
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
    title: 'Premium Audience Data',
    description: 'Access high-value audience segments to increase CPMs and attract premium advertisers.',
  },
  {
    title: 'First-Party Data Enrichment',
    description: 'Enhance your first-party data with demographic, psychographic, and behavioral insights.',
  },
  {
    title: 'Advertiser Targeting',
    description: 'Build custom audiences that match advertiser campaign requirements and maximize fill rates.',
  },
  {
    title: 'Cross-Platform Attribution',
    description: 'Track audience engagement across channels and prove the value of your media properties.',
  },
  {
    title: 'Programmatic Integration',
    description: 'Seamlessly integrate audience data with programmatic platforms and ad servers.',
  },
  {
    title: 'Brand Safety',
    description: 'Ensure advertiser confidence with verified, compliant audience data and transparency.',
  },
]
