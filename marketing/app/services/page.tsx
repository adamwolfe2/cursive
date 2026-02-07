"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, ShoppingCart } from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

export default function ServicesPage() {
  // Service Schema for SEO
  const serviceSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://meetcursive.com/services#data",
        "name": "Cursive Data - Monthly Lead Lists",
        "description": "Get verified B2B contacts delivered monthly. Custom targeting based on your ICP, ready to import into your CRM and activate immediately.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive"
        },
        "serviceType": "Lead Generation",
        "areaServed": "Worldwide",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "1000",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Service",
        "@id": "https://meetcursive.com/services#outbound",
        "name": "Cursive Outbound - Done-For-You Campaigns",
        "description": "We build, launch, and optimize email campaigns using your brand voice. You just close the meetings.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive"
        },
        "serviceType": "Email Marketing Automation",
        "areaServed": "Worldwide",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "2500",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Service",
        "@id": "https://meetcursive.com/services#pipeline",
        "name": "Cursive Pipeline - AI SDR Automation",
        "description": "Your AI team that never sleeps. Researches, writes, sends, follows up, and books meetings -- automatically.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive"
        },
        "serviceType": "Sales Automation",
        "areaServed": "Worldwide",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "5000",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
        {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6">
              Pick Your
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-900 mt-2">
                Growth Model
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              From self-service lead lists to fully managed pipelines -- <span className="font-cursive text-2xl text-gray-900">Cursive</span> scales with you.
              Not sure where to start? Book a call and we'll build a custom plan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Book a Strategy Call
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" href="#comparison">
                Compare Plans
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Service Tiers */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          {/* Cursive Data */}
          <motion.div
            id="data"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-white rounded-full text-sm text-gray-600 mb-6 border border-gray-200">
                  Perfect for teams with existing outbound
                </div>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  <span className="font-cursive text-5xl lg:text-6xl text-gray-900">Cursive</span> Data
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    Monthly Lead Lists
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Get verified B2B contacts delivered monthly. Custom targeting based on your ICP,
                  ready to import into your CRM and activate immediately.
                </p>

                {/* Timeline */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">How It Works</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 1: ICP Definition & Targeting Criteria</div>
                        <p className="text-sm text-gray-600">We work with you to define your ideal customer profile and build targeting filters.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">2</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 2: First List Delivery</div>
                        <p className="text-sm text-gray-600">Your first batch of verified, enriched contacts ready for import.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">{"\u221E"}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Ongoing: Monthly Refresh with New Leads</div>
                        <p className="text-sm text-gray-600">Fresh leads every month, no duplicates, continuously refined targeting.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {dataFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" href="/pricing">
                  See pricing
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                <div className="aspect-square bg-[#F7F9FB] rounded-lg flex items-center justify-center">
                  <div className="text-center p-8 w-full">
                    <h4 className="text-xl font-light text-gray-900 mb-6">Sample Lead List</h4>
                    <div className="space-y-2 text-left bg-white rounded-lg p-4 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-900">Name</span>
                        <span className="text-gray-900">Title</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Sarah Johnson</span>
                        <span>VP Sales</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Mike Chen</span>
                        <span>Head of Growth</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Emily Rodriguez</span>
                        <span>Director, Rev Ops</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Verified contacts with email, phone, LinkedIn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cursive Outbound */}
          <motion.div
            id="outbound"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                  <div className="aspect-square bg-[#F7F9FB] rounded-lg flex items-center justify-center">
                    <div className="text-center p-8 w-full">
                      <h4 className="text-xl font-light text-gray-900 mb-6">Campaign Dashboard</h4>
                      <div className="space-y-3 text-left bg-white rounded-lg p-4 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sent Today</span>
                          <span className="text-[#007AFF]">847</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Open Rate</span>
                          <span className="text-gray-900">67%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Reply Rate</span>
                          <span className="text-[#007AFF]">12%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Meetings Booked</span>
                          <span className="text-gray-900">23</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">
                        Real-time campaign analytics
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-block px-4 py-2 bg-white rounded-full text-sm text-gray-600 mb-6 border border-gray-200">
                  Most Popular
                </div>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  <span className="font-cursive text-5xl lg:text-6xl text-gray-900">Cursive</span> Outbound
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    Done-For-You Campaigns
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  We build, launch, and optimize email campaigns using your brand voice.
                  You just close the meetings.
                </p>

                {/* Timeline */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">How It Works</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 1-2: Domain Setup, Inbox Warmup, Brand Voice Training</div>
                        <p className="text-sm text-gray-600">We configure your email infrastructure and train AI on your brand voice.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">2</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 3: Campaign Launch</div>
                        <p className="text-sm text-gray-600">First AI-personalized campaigns go live with A/B testing.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">{"\u221E"}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 4+: Optimization, Meetings Booked</div>
                        <p className="text-sm text-gray-600">Continuous optimization based on data, with qualified meetings landing on your calendar.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {outboundFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" href="/pricing">
                  See pricing
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Cursive Pipeline */}
          <motion.div
            id="pipeline"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-white rounded-full text-sm text-gray-600 mb-6 border border-gray-200">
                  Full-stack solution
                </div>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  <span className="font-cursive text-5xl lg:text-6xl text-gray-900">Cursive</span> Pipeline
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    AI SDR + Pipeline Management
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Your AI team that never sleeps. Researches, writes, sends, follows up,
                  and books meetings -- automatically.
                </p>

                {/* Timeline */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">How It Works</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 1-3: Full Stack Setup, AI SDR Training</div>
                        <p className="text-sm text-gray-600">Complete infrastructure buildout, AI agent configuration, multi-channel setup, and CRM integration.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#007AFF]">{"\u221E"}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Week 4+: Autonomous Operation, Continuous Pipeline</div>
                        <p className="text-sm text-gray-600">AI SDR agents run 24/7 -- researching, outreaching, following up, and booking meetings on autopilot.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {pipelineFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" href="/pricing">
                  See pricing
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                <div className="aspect-square bg-[#F7F9FB] rounded-lg flex items-center justify-center">
                  <div className="text-center p-8 w-full">
                    <h4 className="text-xl font-light text-gray-900 mb-6">AI SDR Activity</h4>
                    <div className="space-y-3 text-left bg-white rounded-lg p-4 text-sm">
                      <div className="border-l-2 border-[#007AFF] pl-3 py-2">
                        <div className="text-gray-900">Meeting Booked</div>
                        <div className="text-gray-600 text-xs">Salesforce - 2:30 PM tomorrow</div>
                      </div>
                      <div className="border-l-2 border-[#007AFF] pl-3 py-2">
                        <div className="text-gray-900">Follow-up Sent</div>
                        <div className="text-gray-600 text-xs">HubSpot - Sequence 3</div>
                      </div>
                      <div className="border-l-2 border-[#007AFF] pl-3 py-2">
                        <div className="text-gray-900">Research Complete</div>
                        <div className="text-gray-600 text-xs">50 new prospects qualified</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Autonomous AI working 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Self-Serve Cross-Link */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#007AFF]/5 to-blue-50 rounded-2xl p-10 text-center border border-blue-100">
              <ShoppingCart className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <h3 className="text-2xl lg:text-3xl font-light text-gray-900 mb-3">
                Prefer Self-Serve?
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-xl mx-auto">
                Browse the marketplace and find leads on your own terms. Buy credits, search our database, and export contacts instantly.
              </p>
              <Button size="lg" href="/marketplace">
                Browse the Marketplace
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Add-On Services */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Power-Ups
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                & Add-Ons
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enhance any tier with these premium features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Visitor Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-2xl font-light text-gray-900 mb-3">Website Visitor Tracking</h3>
              <p className="text-gray-600 mb-6">
                Install a tracking pixel on your website that identifies anonymous visitors
                and turns them into actionable leads.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">See which companies visit your site</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Get contact info for decision-makers</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Export lists or sync to CRM</span>
                </li>
              </ul>
              <div className="text-2xl font-light text-[#007AFF] mb-4">
                $750/mo + $0.50/visitor
              </div>
              <Button className="w-full" href="/pixel">
                Learn About Pixel
              </Button>
            </motion.div>

            {/* Visitor Retargeting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-2xl font-light text-gray-900 mb-3">Visitor Retargeting</h3>
              <p className="text-gray-600 mb-6">
                Run personalized email campaigns to people who visited your site but didn't convert.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Automated sequences by intent</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Personalized by pages visited</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Higher conversion than cold outbound</span>
                </li>
              </ul>
              <div className="text-2xl font-light text-[#007AFF] mb-4">
                $1,500/mo
              </div>
              <Button className="w-full" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Add Visitor Campaigns
              </Button>
              <p className="text-xs text-gray-500 mt-3">Requires Visitor Tracking add-on</p>
            </motion.div>

            {/* White Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-2xl font-light text-gray-900 mb-3">White Label Platform</h3>
              <p className="text-gray-600 mb-6">
                Get your own branded version of <span className="font-cursive text-xl text-gray-900">Cursive</span> for your team or clients.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Custom domain (leads.yourbrand.com)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Your logo, colors, and branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  <span className="text-gray-700">Full platform access</span>
                </li>
              </ul>
              <div className="text-2xl font-light text-[#007AFF] mb-4">
                $2,000/mo
              </div>
              <Button className="w-full" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Request White Label
              </Button>
              <p className="text-xs text-gray-500 mt-3">Includes up to 10 user seats</p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Compare
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Plans
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl overflow-hidden">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-light text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-light text-gray-900">Data</th>
                  <th className="text-center py-4 px-6 bg-[#F7F9FB] font-light text-gray-900">Outbound</th>
                  <th className="text-center py-4 px-6 font-light text-gray-900">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">{row.feature}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.data}</td>
                    <td className="py-4 px-6 text-center bg-[#F7F9FB] text-gray-700">{row.outbound}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.pipeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">Still unsure? Book a call and we'll recommend the right plan.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Book a Strategy Call
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" href="/pricing">
                View Pricing
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="Ready to 3x"
        subheadline="Your Pipeline?"
        description="Book a 15-minute call. We'll audit your current lead gen and show you exactly how Cursive can help."
      />
    </main>
  </HumanView>

  {/* Machine View - AEO-Optimized */}
  <MachineView>
    <MachineContent>
      {/* Header */}
      <div className="mb-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE SERVICES</h1>
        <p className="text-gray-700 leading-relaxed">
          Done-for-you lead generation services with clear timelines and deliverables. Choose your growth model: Cursive Data (monthly lead lists), Cursive Outbound (managed email campaigns), or Cursive Pipeline (full-stack AI SDR automation). For pricing, visit /pricing.
        </p>
      </div>

      {/* Service Tiers with Process */}
      <MachineSection title="Cursive Data - Monthly Lead Lists">
        <p className="text-gray-400 mb-3">
          Get verified B2B contacts delivered monthly. Custom targeting based on your ICP, ready to import into your CRM and activate immediately.
        </p>
        <p className="text-white mb-2">Timeline:</p>
        <MachineList items={[
          "Week 1: ICP definition and targeting criteria setup",
          "Week 2: First list delivery with verified, enriched contacts",
          "Ongoing: Monthly refresh with new leads, no duplicates"
        ]} />
        <p className="text-white mt-4 mb-2">What You Get:</p>
        <MachineList items={[
          "500-2,000 verified leads per month",
          "Enriched with email, phone, LinkedIn, company data",
          "Custom targeting based on your ICP",
          "CSV export for easy CRM import",
          "Monthly list refresh (no duplicates)",
          "Dedicated account manager"
        ]} />
        <p className="text-gray-400 mt-3">See pricing at /pricing</p>
      </MachineSection>

      <MachineSection title="Cursive Outbound - Done-For-You Campaigns">
        <p className="text-gray-400 mb-3">
          We build, launch, and optimize email campaigns using your brand voice. You just close the meetings.
        </p>
        <p className="text-white mb-2">Timeline:</p>
        <MachineList items={[
          "Week 1-2: Domain setup, inbox warmup, brand voice training",
          "Week 3: Campaign launch with AI-personalized outreach",
          "Week 4+: Optimization, A/B testing, meetings booked on your calendar"
        ]} />
        <p className="text-white mt-4 mb-2">What You Get:</p>
        <MachineList items={[
          "AI-generated campaign copy (personalized at scale)",
          "Email infrastructure setup (domains, inboxes, deliverability)",
          "A/B testing and optimization",
          "200+ emails sent per day per account",
          "Real-time analytics dashboard",
          "Weekly strategy calls",
          "Includes 500 leads/month (or use your own lists)"
        ]} />
        <p className="text-gray-400 mt-3">See pricing at /pricing</p>
      </MachineSection>

      <MachineSection title="Cursive Pipeline - AI SDR Automation">
        <p className="text-gray-400 mb-3">
          Your AI team that never sleeps. Researches, writes, sends, follows up, and books meetings -- automatically.
        </p>
        <p className="text-white mb-2">Timeline:</p>
        <MachineList items={[
          "Week 1-3: Full stack setup, AI SDR training, multi-channel configuration",
          "Week 4+: Autonomous operation, continuous pipeline generation"
        ]} />
        <p className="text-white mt-4 mb-2">What You Get:</p>
        <MachineList items={[
          "Everything in Outbound, plus:",
          "AI SDR agents (research, outreach, follow-ups 24/7)",
          "Multi-channel campaigns (email + LinkedIn)",
          "Unlimited lead enrichment via People Search",
          "API access for custom integrations",
          "White-glove onboarding",
          "Dedicated success manager",
          "Custom reporting and attribution"
        ]} />
        <p className="text-gray-400 mt-3">See pricing at /pricing</p>
      </MachineSection>

      {/* Self-Serve Option */}
      <MachineSection title="Self-Serve Marketplace">
        <p className="text-gray-400 mb-3">
          Prefer to find leads yourself? Browse the Cursive marketplace at /marketplace. Buy credits, search our database, and export contacts instantly. No subscription required.
        </p>
      </MachineSection>

      {/* Add-Ons */}
      <MachineSection title="Add-On Services">
        <MachineList items={[
          {
            label: "Website Visitor Tracking",
            description: "$750/mo + $0.50/visitor - Identify anonymous website visitors in real-time. Learn more at /pixel"
          },
          {
            label: "Visitor Retargeting",
            description: "$1,500/mo - Auto-engage visitors with email and ad campaigns"
          },
          {
            label: "White Label Platform",
            description: "$2,000/mo - Rebrand Cursive for your agency clients (includes 10 seats)"
          }
        ]} />
      </MachineSection>

      {/* Getting Started */}
      <MachineSection title="Get Started">
        <MachineList items={[
          {
            label: "Book Strategy Call",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "15-minute call to discuss your needs and recommend the right service"
          },
          {
            label: "View Pricing",
            href: "https://meetcursive.com/pricing",
            description: "See all pricing options for services and marketplace credits"
          },
          {
            label: "Browse Marketplace",
            href: "https://meetcursive.com/marketplace",
            description: "Self-serve lead search with no subscription required"
          }
        ]} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>
  )
}

// Feature Lists
const dataFeatures = [
  "500-2,000 verified leads per month (based on tier)",
  "Enriched with email, phone, LinkedIn, company data",
  "Custom targeting based on your ICP",
  "CSV export for easy CRM import",
  "Monthly list refresh (no duplicates)",
  "Dedicated account manager",
]

const outboundFeatures = [
  "AI-generated campaign copy (personalized at scale)",
  "Email infrastructure setup (domains, inboxes, deliverability)",
  "A/B testing and optimization",
  "200+ emails sent per day per account",
  "Real-time analytics dashboard",
  "Weekly strategy calls",
  "Includes 500 leads/month (or use your own lists)",
]

const pipelineFeatures = [
  "Everything in Outbound, plus:",
  "AI SDR agents (research, outreach, follow-ups)",
  "Multi-channel campaigns (email + LinkedIn)",
  "Unlimited lead enrichment via People Search",
  "API access for custom integrations",
  "White-glove onboarding",
  "Dedicated success manager",
  "Custom reporting and attribution",
]

// Comparison Table Data
const comparisonRows = [
  { feature: "Monthly Leads", data: "500-2,000", outbound: "500 included", pipeline: "Unlimited" },
  { feature: "Campaign Management", data: "DIY", outbound: "Fully managed", pipeline: "Fully managed" },
  { feature: "AI SDR Agents", data: "\u2014", outbound: "\u2014", pipeline: "Yes" },
  { feature: "Email Infrastructure", data: "\u2014", outbound: "Yes", pipeline: "Yes" },
  { feature: "Multi-channel (Email + LinkedIn)", data: "\u2014", outbound: "\u2014", pipeline: "Yes" },
  { feature: "API Access", data: "\u2014", outbound: "\u2014", pipeline: "Yes" },
  { feature: "People Search", data: "\u2014", outbound: "\u2014", pipeline: "Unlimited" },
  { feature: "Dedicated Manager", data: "Yes", outbound: "Yes", pipeline: "Yes" },
  { feature: "Onboarding Timeline", data: "1-2 weeks", outbound: "2-3 weeks", pipeline: "3-4 weeks" },
]
