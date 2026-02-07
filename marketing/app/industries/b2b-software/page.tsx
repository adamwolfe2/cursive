"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function B2BSoftwarePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'B2B Software', url: 'https://meetcursive.com/industries/b2b-software' },
      ])} />
      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "B2B Software", href: "/industries/b2b-software" },
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
                B2B Software Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Lead generation for SaaS and B2B software companies. Identify in-market buyers and accelerate pipeline growth.
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
              Why Choose Cursive for B2B Software
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
                B2B Software Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for B2B software marketing
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "B2B Audience Targeting Explained",
                  description: "Master B2B targeting strategies to reach decision-makers and buyers.",
                  href: "/blog/audience-targeting"
                },
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Learn the technical methods to identify and track B2B visitors on your site.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "ICP Targeting Guide for B2B Companies",
                  description: "Build and activate your ideal customer profile for better targeting.",
                  href: "/blog/icp-targeting-guide"
                },
                {
                  title: "How to Scale Outbound Without Killing Quality",
                  description: "Scale your outbound campaigns while maintaining personalization and quality.",
                  href: "/blog/scaling-outbound"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Optimize your CRM integrations for better data flow and automation.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage data platforms to boost B2B campaign performance.",
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
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Pipeline Growth?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Book a free strategy call. We'll show you how to identify and convert in-market software buyers.
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
                  <span>Intent data included</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Technographic filtering</span>
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
          <h1 className="text-2xl text-gray-900 font-bold mb-4">B2B SOFTWARE MARKETING SOLUTIONS</h1>
          <p className="text-gray-700 leading-relaxed">
            Lead generation for SaaS and B2B software companies. Identify in-market buyers, leverage intent data, and accelerate pipeline growth with verified contacts and technographic targeting.
          </p>
        </div>

        {/* Overview */}
        <MachineSection title="Solution Overview">
          <p className="text-gray-700 mb-4">
            Cursive provides comprehensive marketing solutions for B2B software companies. Identify prospects actively researching software solutions, filter by technology stack and company characteristics, and activate campaigns across multiple channels to drive pipeline growth.
          </p>
        </MachineSection>

        {/* Key Benefits */}
        <MachineSection title="Why Choose Cursive for B2B Software">
          <MachineList items={[
            {
              label: "Product-Market Fit Targeting",
              description: "Identify companies that match your ideal customer profile based on industry, size, and technology usage"
            },
            {
              label: "Intent Data for Software Buyers",
              description: "Reach prospects actively researching software solutions in your category with buying intent signals"
            },
            {
              label: "Account-Based Marketing",
              description: "Build and activate account lists with verified decision-maker contacts at target companies"
            },
            {
              label: "Technographic Filtering",
              description: "Target companies using specific technologies, tools, or platforms that indicate fit and readiness"
            },
            {
              label: "Integration with Sales Tools",
              description: "Seamlessly push enriched leads to your CRM, marketing automation, and sales engagement tools"
            },
            {
              label: "Pipeline Attribution",
              description: "Track leads from first touch to closed-won and prove the ROI of your marketing programs"
            }
          ]} />
        </MachineSection>

        {/* How It Works */}
        <MachineSection title="How It Works">
          <MachineList items={[
            "Define Target Profile - Specify your ideal customer based on company size, industry, tech stack, and other criteria",
            "Layer Intent Signals - Add intent data to identify companies actively researching software in your category",
            "Find Decision Makers - Get verified contacts for key stakeholders including VPs, Directors, and Managers",
            "Activate Campaigns - Launch multi-channel campaigns across email, ads, direct mail, and sales outreach",
            "Track & Optimize - Monitor pipeline attribution and optimize targeting based on what converts"
          ]} />
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">SaaS Lead Generation:</p>
              <p className="text-gray-400">Identify companies showing intent for your software category and reach decision-makers with personalized outreach.</p>
            </div>
            <div>
              <p className="text-white mb-2">Competitive Displacement:</p>
              <p className="text-gray-400">Target companies using competitor tools with messaging about why your solution is better.</p>
            </div>
            <div>
              <p className="text-white mb-2">Product Launch Campaigns:</p>
              <p className="text-gray-400">Build awareness for new features or products with companies that match your ICP and show buying intent.</p>
            </div>
            <div>
              <p className="text-white mb-2">Enterprise ABM Programs:</p>
              <p className="text-gray-400">Create multi-threaded campaigns targeting multiple stakeholders at high-value target accounts.</p>
            </div>
          </div>
        </MachineSection>

        {/* Features */}
        <MachineSection title="Key Features">
          <MachineList items={[
            "Intent Data - Track 450B+ monthly signals to identify active software buyers",
            "Technographic Data - Filter by current tech stack and tool usage",
            "Verified Contacts - Access emails and phone numbers for decision-makers",
            "CRM Integration - Sync data to Salesforce, HubSpot, and other platforms",
            "Multi-Channel Activation - Deploy across email, ads, direct mail, and sales tools",
            "Pipeline Attribution - Track ROI from first touch to closed-won deals"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Getting Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Book a free consultation to discuss your software marketing needs"
            },
            {
              label: "Website",
              href: "https://meetcursive.com"
            },
            {
              label: "Industries",
              href: "https://meetcursive.com/industries"
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
    title: 'Product-Market Fit Targeting',
    description: 'Identify companies that match your ideal customer profile based on industry, size, and technology usage.',
  },
  {
    title: 'Intent Data for Software Buyers',
    description: 'Reach prospects actively researching software solutions in your category with buying intent signals.',
  },
  {
    title: 'Account-Based Marketing',
    description: 'Build and activate account lists with verified decision-maker contacts at target companies.',
  },
  {
    title: 'Technographic Filtering',
    description: 'Target companies using specific technologies, tools, or platforms that indicate fit and readiness.',
  },
  {
    title: 'Integration with Sales Tools',
    description: 'Seamlessly push enriched leads to your CRM, marketing automation, and sales engagement tools.',
  },
  {
    title: 'Pipeline Attribution',
    description: 'Track leads from first touch to closed-won and prove the ROI of your marketing programs.',
  },
]
