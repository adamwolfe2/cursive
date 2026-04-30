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
    title: "Match Rates That Outclass The Industry",
    description: "40–60% pixel match rates driven by our geo-framing methodology — versus 2–5% for cookie-based providers and 10–15% for IP databases. Deterministic, not modeled.",
    metric: "40–60%",
    metricLabel: "vs 2–5% cookies, 10–15% IP",
  },
  {
    icon: Database,
    title: "Offline-Rooted Identity Graph",
    description: "280M+ verified US consumer records sourced from TransUnion and Experian, refreshed every 30 days against the National Change of Address database. Most providers reconcile annually.",
    metric: "280M+",
    metricLabel: "refreshed every 30 days",
  },
  {
    icon: Zap,
    title: "Coverage You Can't Get Anywhere Else",
    description: "Standard SSP and RTB feeds plus a proprietary 15M-domain organic network. Most intent providers pull from the same ~40,000 signal-source domains. Cursive operates an additional layer no one else has.",
    metric: "15M+",
    metricLabel: "proprietary domains",
  },
  {
    icon: CheckCircle,
    title: "Closed Feedback Loop",
    description: "We map ingested signals back to the URLs, mobile apps, and email exchanges that generated them, then validate against real conversion outcomes. The data set improves with use rather than degrading over time.",
    metric: "Continuous",
    metricLabel: "outcome-validated",
  },
  {
    icon: DollarSign,
    title: "Enterprise-Grade Pricing Structure",
    description: "Pay-as-you-go for evaluation and lower-volume use, or committed tiers from $15K/month for scaled production with significantly lower per-record economics. Self-serve marketplace and managed services also available.",
    metric: "From $15K",
    metricLabel: "monthly committed tier",
  },
  {
    icon: Shield,
    title: "Privacy-First & Compliant",
    description: "Fully compliant with CCPA, GDPR, and all major privacy regulations. Email validation runs continuously through Deep Verify at approximately 20 million records per day. Consumer file is API-only — never licensed as a downloadable export.",
    metric: "20M / day",
    metricLabel: "emails validated",
  },
]

export function CompetitiveAdvantagesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Why Teams Choose
            </h2>
            <p className="font-cursive text-6xl lg:text-7xl text-gray-500 mb-6">
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
                initial={false}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="group bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg hover:border-primary/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/5 transition-all">
                    <Icon className="w-6 h-6 text-gray-700 group-hover:text-primary transition-colors" />
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
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            See the difference for yourself
          </p>
          <a
            href="https://cal.com/cursiveteam/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary border-2 border-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-all group"
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
