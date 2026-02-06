"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { InteractiveFeaturesShowcase } from "@/components/demos/interactive-features-showcase"
import { DashboardCTA } from "@/components/dashboard-cta"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { InteractiveDemosTabs } from "@/components/demos/interactive-demos-tabs"
import { HowItWorksSection } from "@/components/homepage/how-it-works-section"
import { CompetitiveAdvantagesSection } from "@/components/homepage/competitive-advantages-section"
import { FAQSection } from "@/components/homepage/faq-section"
import { CustomerLogos } from "@/components/homepage/customer-logos"
import Link from "next/link"
import { Eye, Target, Bot, TrendingUp, type LucideIcon } from "lucide-react"

export function HumanHomePage() {
  return (
    <main className="bg-white">
      {/* Hero Section - OPTIMIZED FOR CLARITY & CONVERSION */}
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-5xl mx-auto mb-12"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              See Who's Visiting Your Site.
              <span className="block text-gray-500 mt-2">
                Reach Out Before They Leave.
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              <span className="font-cursive text-gray-900 text-2xl">Cursive</span> reveals anonymous website visitors, enriches them with verified contact data, and automates personalized outreach—so you never miss a warm lead.
            </p>

            {/* OPTIMIZED: Stats ABOVE fold for credibility */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-10 py-6 border-y border-gray-200">
              <div className="text-center">
                <div className="text-4xl text-gray-900 mb-1 font-light">70%</div>
                <div className="text-sm text-gray-600">Visitor ID Rate</div>
              </div>
              <div className="text-center">
                <div className="text-4xl text-gray-900 mb-1 font-light">220M+</div>
                <div className="text-sm text-gray-600">Consumer Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-4xl text-gray-900 mb-1 font-light">140M+</div>
                <div className="text-sm text-gray-600">Business Profiles</div>
              </div>
            </div>

            {/* OPTIMIZED: Primary CTA - Clear, benefit-driven, stands out */}
            <Button
              size="lg"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-8 py-4 mb-3"
            >
              Book Your Free AI Audit
            </Button>
            <p className="text-sm text-gray-500">See exactly who's visiting your site—no commitment required</p>
          </motion.div>

          {/* Interactive Features Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <InteractiveFeaturesShowcase />
          </motion.div>

          {/* View All Demos Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mt-8"
          >
            <Link
              href="/demos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#007AFF] border-2 border-[#007AFF] rounded-lg font-medium hover:bg-[#007AFF] hover:text-white transition-all group"
            >
              <span>View All 12 Interactive Demos</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* Customer Logos - Early Social Proof */}
      <CustomerLogos />


      {/* OPTIMIZED: Problem → Solution (Benefit-Led, Not Feature-Led) */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Stop Losing Your Best Prospects
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              98% of website visitors leave without filling out a form. Cursive reveals who they are—so you can reach out while they're still interested.
            </p>
          </div>

          {/* OPTIMIZED: Benefits as outcomes, not features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefitPillars.map((pillar, i) => {
              const Icon = pillar.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 mb-4 flex items-center justify-center bg-gray-100 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">{pillar.title}</h3>
                  <p className="text-gray-600 text-sm">{pillar.description}</p>
                </motion.div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* How It Works - Interactive Demos */}
      <InteractiveDemosTabs />

      {/* Competitive Advantages */}
      <CompetitiveAdvantagesSection />

      {/* Core Features Grid - BENEFIT-LED */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-2">
              Everything You Need to
            </h2>
            <p className="font-cursive text-5xl lg:text-6xl text-gray-500">
              Scale Outbound
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-6 h-6 text-gray-700"
                  >
                    <path d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works - Technical Process */}
      <HowItWorksSection />

      {/* Integrations Showcase */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <IntegrationsShowcase
            title="Works With Your Existing Stack"
            subtitle="200+ native integrations—sync leads to your CRM, trigger campaigns, and automate workflows"
          />
        </Container>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="Ready to See Who's"
        subheadline="Visiting Your Site?"
        description="Book a free AI audit. We'll show you exactly which companies are researching your product right now—and how to convert them."
        ctaText="Book Your Free AI Audit Now"
      />
    </main>
  )
}

// OPTIMIZED: Benefit-focused pillars (outcomes, not features)
const benefitPillars: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: Eye,
    title: "Know Who's Interested",
    description: '70% of your anonymous visitors identified with name, company, and email—before they fill out a form.',
  },
  {
    icon: Bot,
    title: 'Reach Them Fast',
    description: 'AI agents send personalized outreach across email, LinkedIn, and SMS within hours of their visit.',
  },
  {
    icon: TrendingUp,
    title: 'Book More Meetings',
    description: 'Autonomous follow-ups and meeting scheduling that runs 24/7. No manual work required.',
  },
]

// Core Features Data - BENEFIT-LED descriptions
const coreFeatures = [
  {
    title: "Visitor Identification",
    description: "Know which companies are researching your product—before they fill out a form",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    items: [
      "Reveal 70% of anonymous visitors",
      "Company + individual-level data",
      "See exactly which pages they viewed",
      "Track returning visitors"
    ]
  },
  {
    title: "AI-Powered Outreach",
    description: "Your AI SDR that books meetings while you sleep—trained on your best messaging",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    items: [
      "Multi-channel campaigns (email, LinkedIn, SMS)",
      "Personalized at scale",
      "Autonomous follow-ups",
      "Automatic meeting booking"
    ]
  },
  {
    title: "Intent Data",
    description: "Reach prospects actively searching for solutions like yours—right now",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    items: [
      "450B+ monthly intent signals",
      "30,000+ commercial categories",
      "Real-time (not monthly snapshots)",
      "Know when prospects are in-market"
    ]
  },
  {
    title: "Audience Builder",
    description: "Build unlimited lead lists with 220M+ consumer and 140M+ business profiles",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    items: [
      "No caps on audience size",
      "Firmographic + demographic filters",
      "Behavioral segmentation",
      "Create segments in minutes"
    ]
  },
  {
    title: "Direct Mail Automation",
    description: "Turn website visits into physical postcards—offline conversion 3-5x higher",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    items: [
      "Triggered by website behavior",
      "Custom design or templates",
      "Delivered in 48 hours",
      "Track scan rates + responses"
    ]
  },
  {
    title: "CRM Integration",
    description: "Sync leads to Salesforce, HubSpot, and 200+ tools you already use",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    items: [
      "200+ native integrations",
      "Two-way sync",
      "Automated workflows",
      "Real-time updates"
    ]
  },
]

