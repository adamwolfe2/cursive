"use client"

import { motion } from "framer-motion"
import { Container } from "@/components/ui/container"
import {
  MousePointerClick,
  Database,
  UserPlus,
  Zap,
  Rocket,
  TrendingUp,
  ArrowRight,
  type LucideIcon
} from "lucide-react"

interface ProcessStep {
  number: number
  title: string
  description: string
  icon: LucideIcon
  details: string[]
  color: string
}

const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: "Visitor Lands on Website",
    description: "Pixel fires, collects data",
    icon: MousePointerClick,
    details: [
      "Tracking pixel loads instantly",
      "Captures page views, time on site, and behavior",
      "Records device fingerprint and IP address",
      "Works across all pages without forms"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 2,
    title: "Data Enrichment",
    description: "IP resolution, device fingerprinting, identity graph matching",
    icon: Database,
    details: [
      "IP address resolved to company location",
      "Device fingerprinting for cross-session tracking",
      "Identity graph matches across 220M+ profiles",
      "Appends verified email and phone data"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 3,
    title: "Profile Building",
    description: "Append firmographic, demographic, behavioral data",
    icon: UserPlus,
    details: [
      "Company details (size, industry, revenue)",
      "Individual contacts (title, department, seniority)",
      "Behavioral signals (pages viewed, time spent)",
      "Historical visit patterns and frequency"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 4,
    title: "Real-time Scoring",
    description: "Intent signals, fit analysis, buying stage",
    icon: Zap,
    details: [
      "Intent signals from 450B+ monthly data points",
      "ICP fit score based on your criteria",
      "Buying stage detection (research, evaluation, decision)",
      "Prioritization by likelihood to convert"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 5,
    title: "Audience Activation",
    description: "Sync to CRM, ad platforms, email tools",
    icon: Rocket,
    details: [
      "Real-time sync to Salesforce, HubSpot, Pipedrive",
      "Push to ad platforms (Google, Facebook, LinkedIn)",
      "Trigger automated email and SMS campaigns",
      "Direct mail postcards for high-intent visitors"
    ],
    color: "#007AFF" // blue
  },
  {
    number: 6,
    title: "Conversion Tracking",
    description: "Close the loop, prove ROI",
    icon: TrendingUp,
    details: [
      "Track conversions back to original visit",
      "Attribution across multiple touchpoints",
      "Calculate ROI per channel and campaign",
      "Optimize based on what actually drives revenue"
    ],
    color: "#007AFF" // blue
  }
]

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              The Technical Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From anonymous visitor to qualified pipeline in 6 automated steps
            </p>
          </motion.div>
        </div>

        {/* Process Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 hidden lg:block" />

          {/* Steps */}
          <div className="space-y-12">
            {processSteps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="relative"
                >
                  <div className="flex flex-col lg:flex-row items-start gap-6">
                    {/* Step Number Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: step.color }}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      {/* Step Number Badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-900 shadow-sm">
                        {step.number}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className="flex-1">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        {/* Title & Description */}
                        <div className="mb-4">
                          <h3 className="text-xl font-medium text-gray-900 mb-2">
                            {step.title}
                          </h3>
                          <p className="text-gray-600">
                            {step.description}
                          </p>
                        </div>

                        {/* Details List */}
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: index * 0.1 + i * 0.05 }}
                              className="flex items-start gap-3 text-sm text-gray-700"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: step.color }}
                              />
                              <span>{detail}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Arrow Connector (not on last step) */}
                      {index < processSteps.length - 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          className="flex justify-center my-4 lg:hidden"
                        >
                          <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl font-light text-gray-900 mb-2">
              &lt;5 min
            </div>
            <div className="text-sm text-gray-600">
              Setup Time
            </div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl font-light text-gray-900 mb-2">
              Real-time
            </div>
            <div className="text-sm text-gray-600">
              Data Processing
            </div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl font-light text-gray-900 mb-2">
              200+
            </div>
            <div className="text-sm text-gray-600">
              Native Integrations
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
