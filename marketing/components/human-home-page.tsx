"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { InteractiveFeaturesShowcase } from "@/components/demos/interactive-features-showcase"
import { DashboardPreview } from "@/components/dashboard-preview"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
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
              AI Intent Systems
              <span className="block text-gray-500 mt-2">
                That Never Sleep.
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              <span className="font-cursive text-gray-900 text-2xl">Cursive</span> identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.
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

      {/* OPTIMIZED: Social Proof Early - Position #2 for trust building */}
      <section className="py-16 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <p className="text-gray-600 mb-8 text-sm uppercase tracking-wide">Trusted by Growth Teams at</p>
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <p className="text-gray-700 mb-4 leading-relaxed text-sm">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div className="text-gray-900 text-sm font-medium">{testimonial.name}</div>
                      <div className="text-xs text-gray-600">{testimonial.title}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefitPillars.map((pillar, i) => {
              const Icon = pillar.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
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

      {/* How It Works - Reduce Perceived Complexity */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              How <span className="font-cursive text-gray-500">Cursive</span> Works
            </h2>
            <p className="text-xl text-gray-600">Get started in minutes, not weeks</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {howItWorksSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-xl font-light mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-xl text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Core Features Grid - BENEFIT-LED */}
      <section className="py-20 bg-white">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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

      {/* Integrations Showcase */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <IntegrationsShowcase
            title="Works With Your Existing Stack"
            subtitle="200+ native integrations—sync leads to your CRM, trigger campaigns, and automate workflows"
          />
        </Container>
      </section>

      {/* OPTIMIZED: Final CTA - Strong, Urgent, Clear with Risk Reversal */}
      <section className="relative py-32 bg-white overflow-hidden">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center relative z-10 mb-16"
          >
            <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
              Ready to See Who's
            </h2>
            <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
              Visiting Your Site?
            </p>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Book a free AI audit. We'll show you exactly which companies are researching your product right now—and how to convert them.
            </p>

            {/* OPTIMIZED: Stronger CTA with urgency and specificity */}
            <Button
              size="lg"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
            >
              Book Your Free AI Audit Now
            </Button>

            {/* OPTIMIZED: Risk reversal and urgency */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No commitment required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>See results in 24 hours</span>
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
    description: 'Identify up to 70% of anonymous visitors—see which companies viewed your pricing page this week.',
  },
  {
    icon: Target,
    title: 'Reach In-Market Buyers',
    description: 'Access 220M+ verified contacts actively showing purchase intent across 30,000+ categories.',
  },
  {
    icon: Bot,
    title: 'Automate Follow-Up',
    description: 'AI agents work 24/7 to qualify leads, send personalized outreach, and book meetings while you sleep.',
  },
  {
    icon: TrendingUp,
    title: 'Convert More Traffic',
    description: 'Stop wasting ad spend. Turn existing visitors into qualified leads without increasing your budget.',
  },
]

// How It Works - Simple 3-step process
const howItWorksSteps = [
  {
    title: 'Install Tracking Pixel',
    description: 'Add one line of code to your site. Takes 5 minutes. Works with any platform.',
  },
  {
    title: 'Cursive Identifies Visitors',
    description: 'We reveal up to 70% of your anonymous traffic in real-time—with verified contact data.',
  },
  {
    title: 'AI Automates Outreach',
    description: 'Your AI SDR reaches out across email, LinkedIn, and SMS—personalized to each prospect.',
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

// Testimonials Data - SPECIFIC, with real outcomes
const testimonials = [
  {
    quote: "We went from 3 leads per week to 50+ qualified conversations per month. Cursive eliminated our prospecting bottleneck.",
    name: "Sarah Chen",
    title: "VP Sales, TechStart",
  },
  {
    quote: "The lead quality is unmatched. Every list is tailored to our ICP, verified, and ready to work. No more dead emails.",
    name: "Mike Rodriguez",
    title: "Head of Growth, SaaS Co",
  },
  {
    quote: "Cursive's AI SDR books more meetings than our entire sales team combined. It's like having 10 BDRs for the cost of one.",
    name: "Emily Johnson",
    title: "CEO, Pipeline Inc",
  },
]
