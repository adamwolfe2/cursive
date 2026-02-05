"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Search, ShoppingCart, Mail, Target, BarChart3, Zap } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Complete Data-Driven Marketing Platform | Cursive",
  description: "All-in-one B2B lead generation platform with AI Studio, People Search, Lead Marketplace, Campaign Manager, and Visitor Intelligence. 500M+ verified contacts, real-time identification, and automated outreach.",
  keywords: "marketing platform, lead generation software, B2B sales platform, visitor tracking software, email automation platform, AI marketing tools, lead enrichment platform, outbound sales software",
  openGraph: {
    title: "Complete Data-Driven Marketing Platform | Cursive",
    description: "All-in-one B2B lead generation platform with AI Studio, People Search, Lead Marketplace, Campaign Manager, and Visitor Intelligence. 500M+ verified contacts.",
    url: "https://meetcursive.com/platform",
    siteName: "Cursive",
    images: [{ url: "/cursive-social-preview.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Complete Data-Driven Marketing Platform | Cursive",
    description: "All-in-one B2B lead generation platform with AI Studio, People Search, Lead Marketplace, Campaign Manager, and Visitor Intelligence.",
    images: ["/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://meetcursive.com/platform",
  },
}

export default function PlatformPage() {
  return (
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
              The Tools Behind
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                The Results
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              <span className="font-cursive text-2xl text-gray-500">Cursive</span> isn't just a service—it's a platform. Explore the features that power our
              managed services (or use them yourself).
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="https://leads.meetcursive.com" target="_blank">
                Try the Platform
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* AI Studio Feature */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-6">
                AI-Powered Brand Voice
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                AI Studio
                <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                  Build Your Brand Voice
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Train AI on your brand, tone, and messaging. Generate campaign copy, emails,
                and landing pages that sound like you—not a robot.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gray-700 text-xs">1</span>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">Upload Brand Assets</div>
                    <div className="text-gray-600 text-sm">Logos, colors, voice guidelines, example copy</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gray-700 text-xs">2</span>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">AI Learns Your Voice</div>
                    <div className="text-gray-600 text-sm">Analyzes tone, style, and messaging patterns</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gray-700 text-xs">3</span>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">Generate On-Brand Content</div>
                    <div className="text-gray-600 text-sm">Email sequences, landing pages, social copy</div>
                  </div>
                </div>
              </div>

              <Button size="lg" href="https://leads.meetcursive.com/ai-studio" target="_blank">
                Try AI Studio
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"
            >
              <div className="bg-[#F7F9FB] rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-900">Brand Workspace</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 text-sm">
                    <div className="text-gray-500 mb-1">Brand Name</div>
                    <div className="text-gray-900">Acme Corp</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-sm">
                    <div className="text-gray-500 mb-1">Voice & Tone</div>
                    <div className="text-gray-900">Professional, approachable, data-driven</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-sm">
                    <div className="text-gray-500 mb-1">Target Audience</div>
                    <div className="text-gray-900">B2B SaaS founders, $1M-$10M ARR</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#F7F9FB] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-gray-900">Generated Email</h4>
                  <span className="text-xs text-gray-600">Ready to send</span>
                </div>
                <div className="bg-white rounded-lg p-4 text-sm space-y-2">
                  <div className="text-gray-900">Subject: Quick question about [Company]'s growth</div>
                  <div className="text-gray-600 text-xs leading-relaxed">
                    Hey [Name],<br /><br />
                    Noticed you're scaling [Company]'s sales team. Most companies at your stage
                    hit a wall around lead quality...<br /><br />
                    <span className="text-[#007AFF]">View full email →</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* People Search Feature */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <div className="bg-[#F7F9FB] rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-6 h-6 text-primary" />
                    <input
                      type="text"
                      placeholder="Search by name, company, title..."
                      className="flex-1 bg-white rounded-lg px-4 py-2 text-sm border border-gray-200"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-white rounded-lg px-3 py-2 text-xs font-medium border border-gray-200">
                      VP Sales
                    </button>
                    <button className="bg-white rounded-lg px-3 py-2 text-xs font-medium border border-gray-200">
                      SaaS
                    </button>
                    <button className="bg-white rounded-lg px-3 py-2 text-xs font-medium border border-gray-200">
                      $1M+ ARR
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Sarah Johnson", title: "VP of Sales", company: "TechCorp", verified: true },
                    { name: "Mike Chen", title: "Head of Growth", company: "StartupXYZ", verified: true },
                    { name: "Emily Rodriguez", title: "Director, Revenue", company: "SaaS Inc", verified: true },
                  ].map((person, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#007AFF] transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-gray-900 flex items-center gap-2">
                            {person.name}
                            {person.verified && (
                              <span className="px-2 py-0.5 bg-blue-100 text-[#007AFF] text-xs rounded">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{person.title} at {person.company}</div>
                        </div>
                        <button className="text-[#007AFF] text-sm hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  Showing 3 of 247 results
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-6">
                500M+ Verified Contacts
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                People Search
                <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                  Find Anyone, Anywhere
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Search 500M+ verified B2B contacts by name, company, title, location, industry, and more.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Real-time Email Verification</div>
                    <div className="text-gray-600 text-sm">Every email validated before export</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">LinkedIn Profile Enrichment</div>
                    <div className="text-gray-600 text-sm">Direct links to profiles and activity</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Company Firmographics</div>
                    <div className="text-gray-600 text-sm">Revenue, employee count, tech stack, funding</div>
                  </div>
                </div>
              </div>

              <Button size="lg" href="https://leads.meetcursive.com/people-search" target="_blank">
                Try People Search
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Lead Marketplace Feature */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-6">
                Pay-per-lead pricing
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Lead Marketplace
                <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                  Buy Leads On Demand
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Need leads fast? Browse our marketplace of pre-verified B2B contacts.
                No subscriptions required.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Instant CSV Download</div>
                    <div className="text-gray-600 text-sm">Purchase and download immediately</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Filter by Industry & Title</div>
                    <div className="text-gray-600 text-sm">Find exactly who you're looking for</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Credit-Based System</div>
                    <div className="text-gray-600 text-sm">Buy credits, use anytime</div>
                  </div>
                </div>
              </div>

              <Button size="lg" href="https://leads.meetcursive.com/marketplace" target="_blank">
                Browse Marketplace
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"
            >
              <div className="mb-4">
                <h4 className="text-gray-900 mb-3">Featured Lead Lists</h4>
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 bg-[#007AFF] text-white rounded-lg text-xs">
                    All
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                    SaaS
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                    E-commerce
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { title: "VP Sales - SaaS Companies", count: 1247, price: 2.50 },
                  { title: "Marketing Directors - E-commerce", count: 892, price: 2.00 },
                  { title: "CEOs - FinTech Startups", count: 445, price: 3.50 },
                ].map((list, i) => (
                  <div key={i} className="bg-[#F7F9FB] rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-gray-900">{list.title}</div>
                        <div className="text-sm text-gray-600">{list.count.toLocaleString()} contacts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg text-[#007AFF]">${list.price}</div>
                        <div className="text-xs text-gray-600">per lead</div>
                      </div>
                    </div>
                    <button className="w-full bg-[#007AFF] text-white rounded-lg py-2 text-sm hover:bg-[#0066DD] transition-colors">
                      View List
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-[#F7F9FB] rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your Credits</span>
                  <span className="text-[#007AFF]">250 credits</span>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Campaign Manager Feature */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <div className="bg-[#F7F9FB] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-900">Active Campaigns</h4>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Q1 Outbound - VP Sales", status: "Active", sent: 2847, replies: 341 },
                      { name: "Product Launch Follow-up", status: "Scheduled", sent: 0, replies: 0 },
                    ].map((campaign, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-gray-900 text-sm">{campaign.name}</div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            campaign.status === "Active" ? "bg-blue-100 text-[#007AFF]" : "bg-gray-100 text-gray-600"
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs">Sent</div>
                            <div className="text-[#007AFF]">{campaign.sent.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Replies</div>
                            <div className="text-gray-900">{campaign.replies}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 bg-[#007AFF] text-white rounded-lg py-3 text-sm hover:bg-[#0066DD] transition-colors">
                    Create New Campaign
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-6">
                Requires Outbound/Pipeline tier
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Campaign Manager
                <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                  Multi-Channel Outbound
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Build, schedule, and track email campaigns with AI-powered personalization.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">AI-Written Sequences</div>
                    <div className="text-gray-600 text-sm">Personalized at scale</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">A/B Testing Built-in</div>
                    <div className="text-gray-600 text-sm">Test subject lines, copy, timing</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Deliverability Optimization</div>
                    <div className="text-gray-600 text-sm">Domain warming, sender reputation</div>
                  </div>
                </div>
              </div>

              <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Schedule a Demo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Visitor Tracking Feature */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-6">
                Add-on feature
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Visitor Intelligence
                <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                  See Who's on Your Site
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Install a tracking pixel and identify anonymous website visitors in real-time.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Company Identification</div>
                    <div className="text-gray-600 text-sm">See which companies visit your site</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Decision-Maker Contact Export</div>
                    <div className="text-gray-600 text-sm">Get emails for key stakeholders</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Behavior-Based Retargeting</div>
                    <div className="text-gray-600 text-sm">Campaign based on pages visited</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
                <div className="text-2xl font-light text-[#007AFF] mb-2">
                  $750/mo + $0.50/visitor
                </div>
                <p className="text-gray-600 text-sm">Includes pixel installation and setup</p>
              </div>

              <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Add Visitor Tracking
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200"
            >
              <div className="bg-[#F7F9FB] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-900">Today's Visitors</h4>
                </div>

                <div className="space-y-3">
                  {[
                    { company: "Acme Corp", visitors: 12, pages: 23, intent: "High" },
                    { company: "TechStart Inc", visitors: 5, pages: 8, intent: "Medium" },
                    { company: "SaaS Co", visitors: 3, pages: 15, intent: "High" },
                  ].map((visitor, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-900">{visitor.company}</div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          visitor.intent === "High" ? "bg-blue-100 text-[#007AFF]" : "bg-gray-100 text-gray-600"
                        }`}>
                          {visitor.intent} Intent
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Visitors:</span>
                          <span className="text-gray-900 ml-1">{visitor.visitors}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pages:</span>
                          <span className="text-gray-900 ml-1">{visitor.pages}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  87 companies identified today
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="bg-[#007AFF] rounded-3xl p-12 text-center text-white shadow-lg max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Ready to See It in Action?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Book a personalized demo and we'll show you exactly how <span className="font-cursive text-2xl">Cursive</span> can transform your pipeline.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
              >
                Book a Demo
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                href="https://leads.meetcursive.com"
                target="_blank"
              >
                Try the Platform
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
