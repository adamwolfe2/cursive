"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function TechnologyPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Technology', url: 'https://www.meetcursive.com/industries/technology' },
      ])} />
      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Technology", href: "/industries/technology" },
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
                Technology Industry Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Accelerate pipeline growth for technology companies. Identify in-market buyers with intent signals, deanonymize website visitors, and activate ABM campaigns across channels.
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
              Why Choose Cursive for Technology Companies
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
                Technology Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for technology company marketing and demand generation
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "B2B Audience Targeting Explained",
                  description: "Master B2B targeting strategies to reach technology buyers and decision-makers.",
                  href: "/blog/audience-targeting"
                },
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Deanonymize website traffic and turn visitors into qualified pipeline.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "ICP Targeting Guide for Technology Companies",
                  description: "Build and activate your ideal customer profile for precision targeting.",
                  href: "/blog/icp-targeting-guide"
                },
                {
                  title: "How to Scale Outbound Without Killing Quality",
                  description: "Scale outbound campaigns while maintaining relevance and personalization.",
                  href: "/blog/scaling-outbound"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Optimize your CRM integrations for seamless data flow and pipeline tracking.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage intent data and enrichment to improve campaign performance.",
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
                Ready to Accelerate Your
              </h2>
              <p className="font-cursive text-4xl lg:text-5xl text-gray-500 mb-6">
                Pipeline Growth?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Book a free strategy call. We'll show you how to identify in-market technology buyers and convert them into pipeline.
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
                  <span>Intent data included</span>
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
                  <span>ABM campaigns</span>
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
          <h1 className="text-2xl text-gray-900 font-bold mb-4">TECHNOLOGY INDUSTRY MARKETING SOLUTIONS</h1>
          <p className="text-gray-700 leading-relaxed">
            Demand generation and pipeline acceleration for technology companies. Identify in-market buyers with intent signals, deanonymize website visitors, and activate account-based marketing campaigns across channels.
          </p>
        </div>

        {/* Overview */}
        <MachineSection title="Solution Overview">
          <p className="text-gray-700 mb-4">
            Cursive helps technology companies identify prospects actively researching solutions in their category, deanonymize website visitors, and activate targeted campaigns across email, ads, and direct mail. Built for demand generation teams at hardware, software, IT services, and managed services companies.
          </p>
        </MachineSection>

        {/* Key Benefits */}
        <MachineSection title="Why Choose Cursive for Technology">
          <MachineList items={[
            {
              label: "Intent Data for Technology Buyers",
              description: "Track buying signals across 450B+ monthly intent events to identify companies researching technology solutions"
            },
            {
              label: "Visitor Deanonymization",
              description: "Identify the companies and individuals visiting your website and match them to verified contact data"
            },
            {
              label: "Account-Based Marketing",
              description: "Build and activate account lists with verified decision-maker contacts at target technology companies"
            },
            {
              label: "Technographic Targeting",
              description: "Filter prospects by current technology stack, tools, and platforms to identify fit and readiness"
            },
            {
              label: "Pipeline Acceleration",
              description: "Prioritize accounts showing active buying intent and engage them with personalized multi-channel campaigns"
            },
            {
              label: "Sales & Marketing Alignment",
              description: "Share enriched account intelligence between marketing and sales teams via CRM integration"
            }
          ]} />
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Demand Generation:</p>
              <p className="text-gray-400">Identify companies researching solutions in your category and engage them with targeted content and outreach.</p>
            </div>
            <div>
              <p className="text-white mb-2">Competitive Intelligence:</p>
              <p className="text-gray-400">Track companies evaluating competitor solutions and engage them with differentiated messaging.</p>
            </div>
            <div>
              <p className="text-white mb-2">Product Launch Campaigns:</p>
              <p className="text-gray-400">Build awareness for new products with companies that match your ICP and show active buying intent.</p>
            </div>
            <div>
              <p className="text-white mb-2">Channel Partner Enablement:</p>
              <p className="text-gray-400">Provide partners with intent-qualified leads and account intelligence to accelerate their sales cycles.</p>
            </div>
          </div>
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Getting Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/cursive/30min",
              description: "Book a free consultation for your technology marketing needs"
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
    title: 'Intent Data for Technology Buyers',
    description: 'Track buying signals to identify companies actively researching technology solutions in your category.',
  },
  {
    title: 'Visitor Deanonymization',
    description: 'Identify the companies and individuals visiting your website and match them to verified contact data.',
  },
  {
    title: 'Account-Based Marketing',
    description: 'Build and activate account lists with verified decision-maker contacts at target technology companies.',
  },
  {
    title: 'Technographic Targeting',
    description: 'Filter prospects by current technology stack, tools, and platforms to identify fit and readiness.',
  },
  {
    title: 'Pipeline Acceleration',
    description: 'Prioritize accounts showing active buying intent and engage them with personalized multi-channel campaigns.',
  },
  {
    title: 'Sales & Marketing Alignment',
    description: 'Share enriched account intelligence between marketing and sales teams via CRM integration.',
  },
]
