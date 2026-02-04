"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <main className="bg-[#F7F9FB]">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight">
                AI Intent Systems
                <span className="block text-gray-500 mt-2">
                  That Never Sleep.
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                <span className="font-[var(--font-great-vibes)] text-3xl text-[#007AFF]">Cursive</span> identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.
              </p>
              <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Free AI Audit
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="w-32 h-32 text-[#007AFF]"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Enterprise Features, Startup Speed */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-2">
              Enterprise Features
            </h2>
            <p className="font-[var(--font-great-vibes)] text-5xl lg:text-6xl text-[#007AFF]">
              Startup Speed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-8 h-8 text-[#007AFF]"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Every visitor identified,
            </h2>
            <p className="font-[var(--font-great-vibes)] text-5xl lg:text-6xl text-[#007AFF] mb-8">
              enriched, and scored
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Custom pixel sits above your site, identifies anonymous visitors, enriches with contact data, and triggers intent scoring. Feeds directly into your CRM—no manual data entry. The intelligence layer learns from every session.
            </p>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <Container>
          <div className="grid md:grid-cols-3 gap-12 text-center max-w-4xl mx-auto">
            <div>
              <div className="text-5xl font-light text-[#007AFF] mb-2">500M+</div>
              <div className="text-gray-600">Verified Contacts</div>
            </div>
            <div>
              <div className="text-5xl font-light text-[#007AFF] mb-2">99%</div>
              <div className="text-gray-600">Data Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-light text-[#007AFF] mb-2">24/7</div>
              <div className="text-gray-600">AI Agents Active</div>
            </div>
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
                className="bg-white rounded-lg p-8"
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
              Book a call to see how Cursive can transform your pipeline.
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

// Features Data
const features = [
  {
    title: "Pixel Lead Tracking",
    description: "Every visitor identified, enriched, and scored",
  },
  {
    title: "Database Reactivation",
    description: "Wake up dormant leads with intent signals",
  },
  {
    title: "Multitouch Outreach",
    description: "Automated sequences across email and LinkedIn",
  },
  {
    title: "Ask CursiveCore",
    description: "AI assistant trained on your entire pipeline",
  },
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
