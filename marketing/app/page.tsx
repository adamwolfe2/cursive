"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { InteractiveFeaturesShowcase } from "@/components/demos/interactive-features-showcase"

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* Hero Section with Interactive Demo */}
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto mb-16"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              AI Intent Systems
              <span className="block text-gray-500 mt-2">
                That Never Sleep.
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              <span className="font-[var(--font-great-vibes)] text-4xl text-[#007AFF]">Cursive</span> identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
              Get started. It's FREE!
            </Button>
          </motion.div>

          {/* Interactive Features Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <InteractiveFeaturesShowcase />
          </motion.div>
        </Container>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Everything you need to run
            </h2>
            <p className="font-[var(--font-great-vibes)] text-5xl lg:text-6xl text-[#007AFF]">
              outbound at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-8"
              >
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

      {/* Stats Section */}
      <section className="py-20 bg-white">
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
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-2">
              Trusted by Growth Teams
            </h2>
            <p className="font-[var(--font-great-vibes)] text-5xl lg:text-6xl text-[#007AFF]">
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

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Book a call to see how <span className="font-[var(--font-great-vibes)] text-3xl">Cursive</span> can transform your pipeline.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#007AFF] hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
            >
              Book a Call
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}

// Core Features Data
const coreFeatures = [
  {
    title: "Pixel Lead Tracking",
    description: "Identify every website visitor and track their journey",
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
