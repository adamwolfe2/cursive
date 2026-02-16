"use client"

import { motion } from "framer-motion"
import { CheckCircle, TrendingUp, Database, Zap, DollarSign, Shield } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Advantage {
  icon: LucideIcon
  title: string
  description: string
  metric: string
  metricLabel: string
}

const advantages: Advantage[] = [
  {
    icon: TrendingUp,
    title: "Industry-Leading Match Rates",
    description: "Identify up to 70% of your website visitors—more than double the industry average of 30-40%. See exactly who's browsing your pricing page before they fill out a form.",
    metric: "70%",
    metricLabel: "vs 30-40% industry avg"
  },
  {
    icon: Database,
    title: "Largest Data Universe",
    description: "Access 220M+ consumer profiles and 140M+ business profiles with verified contact information. Build unlimited audiences without size caps or restrictive licensing.",
    metric: "360M+",
    metricLabel: "total profiles"
  },
  {
    icon: Zap,
    title: "Real-Time Enrichment",
    description: "Get visitor data instantly—not hours or days later. Real-time identification and enrichment means you can reach out while prospects are actively engaged.",
    metric: "Real-time",
    metricLabel: "not batch processing"
  },
  {
    icon: DollarSign,
    title: "No Minimum Spend",
    description: "Start at just $1,000/month with no long-term contracts or minimum commitments. Scale up or down based on your needs—no vendor lock-in.",
    metric: "$1,000/mo",
    metricLabel: "starting price"
  },
  {
    icon: CheckCircle,
    title: "Direct Data Access",
    description: "We own our data infrastructure—no middleman markup. Get better pricing on higher quality data without paying for unnecessary intermediaries.",
    metric: "Direct",
    metricLabel: "no middleman fees"
  },
  {
    icon: Shield,
    title: "Privacy-First Approach",
    description: "Fully compliant with CCPA, GDPR, and all major privacy regulations. We honor opt-out requests and maintain strict data handling policies.",
    metric: "100%",
    metricLabel: "compliant"
  }
]

export function CompetitiveAdvantagesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Why Teams Choose
            </h2>
            <p className="font-cursive text-5xl lg:text-6xl text-gray-500 mb-6">
              Cursive
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern growth teams who need more than just data—they need results.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon
            return (
              <motion.div
                key={advantage.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="group bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg hover:border-[#007AFF]/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center group-hover:from-[#007AFF]/10 group-hover:to-[#007AFF]/5 transition-all">
                    <Icon className="w-6 h-6 text-gray-700 group-hover:text-[#007AFF] transition-colors" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl text-gray-900 mb-2 font-medium">
                      {advantage.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {advantage.description}
                    </p>

                    {/* Metric */}
                    <div className="inline-flex items-baseline gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg">
                      <span className="text-2xl font-light text-gray-900">
                        {advantage.metric}
                      </span>
                      <span className="text-xs text-gray-600 uppercase tracking-wide">
                        {advantage.metricLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            See the difference for yourself
          </p>
          <a
            href="https://cal.com/cursive/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#007AFF] border-2 border-[#007AFF] rounded-lg font-medium hover:bg-[#007AFF] hover:text-white transition-all group"
          >
            <span>Book Your Free AI Audit</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
