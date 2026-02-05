"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { InteractiveFeaturesShowcase } from "@/components/demos/interactive-features-showcase"
import { StructuredData } from "@/components/seo/structured-data"
import { generateOrganizationSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import Link from "next/link"

export default function HomePage() {
  return (
    <>
      <StructuredData data={generateOrganizationSchema()} />
      <main className="bg-white">
      {/* Hero Section with Interactive Demo */}
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-5xl mx-auto mb-16"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              AI Intent Systems
              <span className="block text-gray-500 mt-2">
                That Never Sleep.
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              <span className="font-cursive text-gray-900 text-2xl">Cursive</span> identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
              Get started. It's FREE!
            </Button>
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

      {/* Core Value Pillars */}
      <section className="py-20 bg-white">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
            The Complete Data-Driven Marketing Solution
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValuePillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-transparent rounded-xl p-6 border border-blue-200"
              >
                <h3 className="text-xl text-gray-900 mb-3">{pillar.title}</h3>
                <p className="text-gray-600 text-sm">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Data Stats */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4 text-center">
            Direct Data Access,
          </h2>
          <p className="font-cursive text-5xl text-gray-900 mb-12 text-center">On Demand</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {dataStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl text-gray-900 mb-2 font-light">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 mb-2 whitespace-nowrap">
              Everything you need to run
            </h2>
            <p className="font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 whitespace-nowrap">
              outbound at scale
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
                className="bg-white rounded-xl border border-gray-200 p-8"
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
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-3 gap-12 text-center max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl font-light text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-2">
              Trusted by Growth Teams
            </h2>
            <p className="font-cursive text-3xl lg:text-4xl text-gray-500">
              Who Move Fast
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 border border-gray-200"
              >
                <p className="text-gray-700 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Integrations Showcase */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <IntegrationsShowcase
            title="Integrates With Everything You Use"
            subtitle="Connect your favorite tools and automate your workflow with 200+ integrations"
          />
        </Container>
      </section>

      {/* Final CTA */}
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
              We Know Who's Searching For What
            </h2>
            <p className="font-cursive text-6xl lg:text-8xl text-gray-500 mb-12">
              With Cursive
            </p>
            <Button
              size="lg"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              className="bg-[#007AFF] text-white hover:bg-[#0066DD]"
            >
              Get Started. It's FREE!
            </Button>
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
              {/* Fade to White at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F7F9FB] via-[#F7F9FB]/80 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
    </>
  )
}

// Core Value Pillars Data
const coreValuePillars = [
  {
    title: 'Powerful Visitor Identification',
    description: 'Uncover up to 70% of your anonymous website traffic—turn hidden visitors into qualified prospects.',
  },
  {
    title: 'Audience Builder Without Limits',
    description: 'Create audiences instantly—no caps, no restrictions. Reach buyers actively showing intent across 25,000+ commercial categories.',
  },
  {
    title: 'Real-Time Data, Real Results',
    description: 'Update, capture, and enrich your data instantly—then take action the moment it matters.',
  },
  {
    title: 'Maximum Value, Every Time',
    description: 'Our advanced technology processes data faster and more cost-effectively, delivering exceptional value.',
  },
]

// Data Stats
const dataStats = [
  { value: '220M+', label: 'Consumer Profiles' },
  { value: '140M+', label: 'Business Profiles' },
  { value: '30,000+', label: 'Intent Categories' },
]

// Core Features Data
const coreFeatures = [
  {
    title: "Pixel Lead Tracking",
    description: "Identify every website visitor and track their journey",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    items: [
      "Anonymous visitor identification",
      "Company enrichment",
      "Intent scoring",
      "CRM auto-sync"
    ]
  },
  {
    title: "AI-Powered Outreach",
    description: "Automated sequences that actually convert",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    items: [
      "Multi-touch campaigns",
      "Brand voice training",
      "Reply detection",
      "Meeting booking"
    ]
  },
  {
    title: "People Search",
    description: "500M+ verified B2B contacts at your fingertips",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    items: [
      "Advanced filtering",
      "Email verification",
      "Phone numbers",
      "LinkedIn profiles"
    ]
  },
  {
    title: "Pipeline Dashboard",
    description: "Real-time metrics and deal tracking",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    items: [
      "Live pipeline view",
      "Conversion analytics",
      "Lead source tracking",
      "Revenue forecasting"
    ]
  },
  {
    title: "Lead Marketplace",
    description: "Purchase verified lead lists on demand",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    items: [
      "Pre-built lists",
      "Custom targeting",
      "99% accuracy",
      "Instant delivery"
    ]
  },
  {
    title: "AI Studio",
    description: "Train AI on your brand and messaging",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    items: [
      "Brand voice setup",
      "Copy generation",
      "A/B testing",
      "Performance insights"
    ]
  },
]

// Stats Data
const stats = [
  { value: "500M+", label: "Verified Contacts" },
  { value: "99%", label: "Data Accuracy" },
  { value: "24/7", label: "AI Agents Active" },
]

// Testimonials Data
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
