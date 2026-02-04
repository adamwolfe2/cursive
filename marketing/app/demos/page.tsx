"use client"

import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { InteractiveFeaturesShowcase } from "@/components/demos/interactive-features-showcase"
import Link from "next/link"

export default function DemosPage() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-blue-50 to-purple-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 mb-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-sm text-gray-600">12 Interactive Demos</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Experience
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                Cursive in Action
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Explore our complete platform through interactive demos. See how Cursive identifies visitors, enriches data, and automates outbound—all in real-time.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="px-6 py-3 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0066DD] transition-colors"
              >
                Book a Live Demo
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Demo Categories */}
      <section className="py-12 bg-white">
        <Container>
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              {
                title: "Core Features",
                description: "Visitor tracking, intent signals, and audience building",
                count: 4,
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                title: "Engagement Tools",
                description: "AI-powered campaigns and email validation",
                count: 3,
                icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              },
              {
                title: "Analytics",
                description: "Pipeline metrics, attribution, and account intelligence",
                count: 3,
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              },
              {
                title: "Data & Tools",
                description: "People search and lead marketplace",
                count: 2,
                icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
              },
            ].map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-transparent rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] transition-all"
              >
                <svg className="w-8 h-8 text-[#007AFF] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                </svg>
                <h3 className="text-lg text-gray-900 font-medium mb-2">{category.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                <div className="text-xs text-[#007AFF] font-medium">{category.count} demos</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Interactive Demos */}
      <section className="py-12 bg-[#F7F9FB]">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <InteractiveFeaturesShowcase />
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto"
          >
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Ready to See It In Your Business?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Book a personalized demo and see how Cursive can transform your lead generation.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="px-8 py-4 bg-white text-[#007AFF] rounded-lg font-medium hover:bg-gray-100 transition-colors text-lg"
              >
                Book a Live Demo
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-medium hover:bg-white/10 transition-colors text-lg"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
  )
}
