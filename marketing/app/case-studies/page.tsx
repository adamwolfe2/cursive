"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, Users, Target, BarChart3 } from "lucide-react"

export default function CaseStudiesPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Real Results from
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-900 mt-2">
                Real Companies
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              See how B2B companies use Cursive to 3x their pipeline and accelerate growth.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Case Study 1 - SaaS Company */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block px-4 py-2 bg-blue-100 text-primary rounded-full text-sm font-medium mb-6">
                SaaS • Series A • $5M ARR
              </div>
              <h2 className="text-4xl font-bold mb-4">
                TechStart Scales from 3 to 50+
                <span className="block font-cursive text-4xl text-gray-500 mt-2">
                  Qualified Leads per Month
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                A B2B SaaS company struggling with inconsistent lead flow used Cursive Outbound
                to eliminate their prospecting bottleneck and scale revenue.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-primary mb-1">17x</div>
                  <div className="text-sm text-gray-600">Lead Growth</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-primary mb-1">$2.4M</div>
                  <div className="text-sm text-gray-600">Pipeline Added</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-primary mb-1">3 mo</div>
                  <div className="text-sm text-gray-600">Time to ROI</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8">
                <p className="text-gray-700 italic leading-relaxed">
                  "We went from 3 leads per week to 50+ qualified conversations per month. Cursive
                  eliminated our prospecting bottleneck and gave our sales team the pipeline they
                  needed to hit quota."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    SC
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-sm text-gray-600">VP of Sales, TechStart</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold mb-6">The Challenge</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xl">×</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Sales team spending 60% of time on prospecting instead of closing
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xl">×</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Inconsistent lead flow causing unpredictable revenue
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xl">×</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Low-quality leads from generic databases
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-6">The Solution</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xl">✓</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Cursive Outbound</strong> - Fully managed campaigns targeting VP of Sales at $1M-$10M SaaS companies
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xl">✓</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      AI-personalized sequences with 200+ emails/day
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xl">✓</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Weekly optimization calls to improve messaging and targeting
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Case Study 2 - E-commerce Company */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold mb-6">The Problem</h3>
                <p className="text-gray-700 mb-6">
                  GrowthCo was buying lead lists from multiple vendors, resulting in:
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-600">•</span> 40% bounce rate on emails
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-600">•</span> Duplicate contacts across lists
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-600">•</span> No targeting or enrichment
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-600">•</span> Wasting $5k/month on bad data
                  </li>
                </ul>

                <h3 className="text-xl font-bold mb-6">The Results</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Email Deliverability</span>
                      <span className="text-2xl font-bold text-blue-600">98%</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Cost Savings</span>
                      <span className="text-2xl font-bold text-blue-600">$3.2k/mo</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Reply Rate</span>
                      <span className="text-2xl font-bold text-blue-600">14%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-block px-4 py-2 bg-blue-100 text-primary rounded-full text-sm font-medium mb-6">
                E-commerce • Bootstrapped • $3M ARR
              </div>
              <h2 className="text-4xl font-bold mb-4">
                GrowthCo Cuts Lead Costs by 65%
                <span className="block font-cursive text-4xl text-gray-500 mt-2">
                  While Improving Quality
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                An e-commerce company tired of bad lead data switched to Cursive Data
                and saw immediate improvements in deliverability and engagement.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-1">65%</div>
                  <div className="text-sm text-gray-600">Cost Reduction</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-1">98%</div>
                  <div className="text-sm text-gray-600">Deliverability</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-1">2,000</div>
                  <div className="text-sm text-gray-600">Leads/Month</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <p className="text-gray-700 italic leading-relaxed mb-4">
                  "The lead quality is unmatched. Every list is tailored to our ICP, verified,
                  and ready to work. We cut costs by 65% while improving our reply rate from 3% to 14%."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    MR
                  </div>
                  <div>
                    <div className="font-semibold">Mike Rodriguez</div>
                    <div className="text-sm text-gray-600">Head of Growth, GrowthCo</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Case Study 3 - Services Company */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block px-4 py-2 bg-blue-100 text-primary rounded-full text-sm font-medium mb-6">
                Professional Services • Series B • $15M ARR
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Pipeline Inc Books 10x More Meetings
                <span className="block font-cursive text-4xl text-gray-500 mt-2">
                  With AI SDR Agents
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                A professional services firm replaced their entire BDR team with Cursive Pipeline
                and 10x'd their meeting volume while cutting costs.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-primary mb-1">10x</div>
                  <div className="text-sm text-gray-600">More Meetings</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-primary mb-1">$180k</div>
                  <div className="text-sm text-gray-600">Cost Savings</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                  <div className="text-sm text-gray-600">AI Working</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <p className="text-gray-700 italic leading-relaxed mb-4">
                  "Cursive's AI SDR books more meetings than our entire sales team combined.
                  It's like having 10 BDRs for the cost of one, and it never sleeps."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    EJ
                  </div>
                  <div>
                    <div className="font-semibold">Emily Johnson</div>
                    <div className="text-sm text-gray-600">CEO, Pipeline Inc</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold mb-6">Before Cursive</h3>
                <div className="space-y-3 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Meetings Booked</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">BDR Team Size</span>
                    <span className="font-bold">3 people</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Cost</span>
                    <span className="font-bold">$25,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Hours Worked</span>
                    <span className="font-bold">480/mo</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-6">After Cursive Pipeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Meetings Booked</span>
                    <span className="font-bold text-blue-600">120</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">BDR Team Size</span>
                    <span className="font-bold text-blue-600">0 people</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Cost</span>
                    <span className="font-bold text-blue-600">$10,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Hours Worked</span>
                    <span className="font-bold text-blue-600">720/mo (24/7)</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">$180,000</div>
                    <div className="text-sm text-gray-700">Annual Cost Savings</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Stats Overview */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Average Results
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Across All Customers
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">3x</div>
              <div className="text-gray-600">Pipeline Growth</div>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-blue-600 mb-2">14%</div>
              <div className="text-gray-600">Reply Rate</div>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">Deliverability</div>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-blue-600 mb-2">$2.1M</div>
              <div className="text-gray-600">Avg Pipeline Added</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <DashboardCTA
        headline="Ready to Get"
        subheadline="Results Like These?"
        description="Book a demo and see how Cursive can help you 3x pipeline, improve lead quality, and scale revenue without scaling headcount."
      />
    </main>
  )
}
