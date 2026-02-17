"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Check, X } from "lucide-react"

interface Competitor {
  name: string
  logo: string
  slug: string
}

const competitors: Competitor[] = [
  { name: "ZoomInfo", logo: "◆", slug: "zoominfo" },
  { name: "6sense", logo: "●", slug: "6sense" },
  { name: "Clearbit", logo: "■", slug: "clearbit" },
  { name: "Apollo", logo: "▲", slug: "apollo" },
  { name: "LeadIQ", logo: "●", slug: "leadiq" },
  { name: "Lusha", logo: "■", slug: "lusha" },
  { name: "Hunter", logo: "◆", slug: "hunter" },
  { name: "RocketReach", logo: "●", slug: "rocketreach" },
  { name: "UpLead", logo: "▲", slug: "uplead" },
]

export function CompetitorComparisonGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            See How We Stack Up
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Exploring visitor identification tools or looking for a better alternative?
            Cursive is the modern platform for B2B lead generation, tracking, and automation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {competitors.map((competitor, i) => (
            <motion.div
              key={competitor.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/compare/${competitor.slug}`}
                className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-[#007AFF] hover:shadow-lg transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {competitor.logo}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{competitor.name}</h3>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 group-hover:text-[#007AFF] transition-colors">
                  <span>Cursive vs {competitor.name}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface ComparisonBenefit {
  title: string
  cursive: string
  competitor: string
}

interface ComparisonPageProps {
  competitorName: string
  competitorLogo: string
  benefits: ComparisonBenefit[]
  features: ComparisonFeature[]
}

interface ComparisonFeature {
  name: string
  cursive: boolean | string
  competitor: boolean | string
}

export function ComparisonPage({ competitorName, competitorLogo, benefits, features }: ComparisonPageProps) {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-lg text-gray-600">
              <img src="/cursive-logo.png" alt="Cursive" className="w-8 h-8" />
              <span className="font-medium text-gray-900">Cursive</span>
            </div>
            <span className="text-gray-400">vs</span>
            <div className="flex items-center gap-2 text-lg text-gray-600">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                {competitorLogo}
              </div>
              <span className="font-medium text-gray-900">{competitorName}</span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6 max-w-4xl">
            Cursive vs {competitorName}: Which lead generation platform is best?
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl">
            Both platforms help you identify and engage prospects. But Cursive goes further—with
            AI-powered automation, multi-channel campaigns, and verified contact data that turns visitors into revenue.
          </p>

          <div className="flex gap-4">
            <Link
              href="https://cal.com/cursive/30min"
              className="inline-flex items-center px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0066DD] transition-colors"
            >
              Start for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="https://cal.com/cursive/30min"
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Cursive Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 text-center mb-16">
            Why choose <span className="font-cursive text-5xl lg:text-6xl text-gray-500">Cursive</span> over {competitorName}?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-medium text-gray-900 mb-4">{benefit.title}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">{competitorName}:</div>
                    <p className="text-gray-700">{benefit.competitor}</p>
                  </div>
                  <div>
                    <div className="text-sm text-[#007AFF] font-medium mb-2">Cursive:</div>
                    <p className="text-gray-900 font-medium">{benefit.cursive}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light text-gray-900 text-center mb-12">
            Compare Cursive vs {competitorName}
          </h2>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      <img src="/cursive-logo.png" alt="Cursive" className="w-5 h-5" />
                      Cursive
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs">
                        {competitorLogo}
                      </div>
                      {competitorName}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-6 py-4 text-sm text-gray-900">{feature.name}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.cursive === 'boolean' ? (
                        feature.cursive ? (
                          <Check className="w-5 h-5 text-blue-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-900 font-medium">{feature.cursive}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.competitor === 'boolean' ? (
                        feature.competitor ? (
                          <Check className="w-5 h-5 text-gray-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{feature.competitor}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            Ready to switch to <span className="font-cursive text-5xl lg:text-6xl text-gray-500">Cursive</span>?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            See how Cursive can help you identify more visitors, build better lists, and close more deals.
          </p>
          <Link
            href="https://cal.com/cursive/30min"
            className="inline-flex items-center px-8 py-4 bg-[#007AFF] text-white text-lg rounded-lg hover:bg-[#0066DD] transition-colors"
          >
            Book Your Free Audit
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}

// Example usage data for ZoomInfo comparison
export const zoomInfoComparison = {
  competitorName: "ZoomInfo",
  competitorLogo: "◆",
  benefits: [
    {
      title: "From visitors to customers",
      cursive: "Identify website visitors, enrich with intent data, and launch automated outbound—all in one platform. No switching between tools.",
      competitor: "Shows you company data and contacts, but you need separate tools for outreach, intent signals, and automation.",
    },
    {
      title: "AI-powered automation",
      cursive: "AI agents qualify leads, write personalized emails, and book meetings 24/7. Set it and forget it.",
      competitor: "Manual workflows. You extract data, then copy it to your CRM, then set up campaigns elsewhere.",
    },
    {
      title: "Better value",
      cursive: "Starting at $1,000/month for unlimited visitor ID + 1,000 enriched contacts + AI automation. No hidden fees.",
      competitor: "Starts at $15,000+/year with strict seat limits, contact export caps, and expensive add-ons.",
    },
  ],
  features: [
    { name: "Website visitor identification", cursive: true, competitor: false },
    { name: "B2B contact database", cursive: true, competitor: true },
    { name: "Intent data signals", cursive: true, competitor: "Add-on ($$$)" },
    { name: "Multi-channel campaigns", cursive: true, competitor: false },
    { name: "AI-powered outreach", cursive: true, competitor: false },
    { name: "Direct mail automation", cursive: true, competitor: false },
    { name: "CRM integration", cursive: true, competitor: true },
    { name: "Pricing transparency", cursive: "Clear pricing", competitor: "Enterprise only" },
    { name: "Starting price", cursive: "$1,000/mo", competitor: "$15,000+/yr" },
    { name: "Setup time", cursive: "5 minutes", competitor: "Weeks" },
  ],
}
