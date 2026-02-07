"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { TrendingUp, Users, Target, BarChart3, Check, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CaseStudiesPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-32 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Customer Results
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Anonymized results from real Cursive clients across SaaS, agencies, financial services, and eCommerce. These are the outcomes our customers see when they partner with us.
            </p>
            <Button
              size="lg"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              className="bg-[#007AFF] hover:bg-[#0066DD]"
            >
              Get Results Like These
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Results Cards */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <TrendingUp className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">B2B SaaS Company</div>
              <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">3x pipeline in 90 days</h3>
              <p className="text-gray-600 text-sm text-center">
                From 50 to 150+ qualified meetings per quarter using Cursive Pipeline
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <Users className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">Digital Marketing Agency</div>
              <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">12 new clients via white-label</h3>
              <p className="text-gray-600 text-sm text-center">
                White-labeled Cursive to offer data services, adding $144k ARR
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <Target className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">Financial Services Firm</div>
              <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">67% lower CPL</h3>
              <p className="text-gray-600 text-sm text-center">
                Replaced ZoomInfo + SDR team with Cursive Outbound, saving $180k/year
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <BarChart3 className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">eCommerce Brand</div>
              <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">4.2x ROAS on retargeting</h3>
              <p className="text-gray-600 text-sm text-center">
                Visitor pixel + automated retargeting drove $2.1M in attributed revenue
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Detailed Case Study 1: B2B SaaS */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-[#007AFF]" />
              <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">B2B SaaS Company</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
              From 50 to 150+ Qualified Meetings Per Quarter
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl text-[#007AFF] mb-1">3x</div>
                <p className="text-gray-600 text-sm">Pipeline increase in 90 days</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl text-[#007AFF] mb-1">150+</div>
                <p className="text-gray-600 text-sm">Qualified meetings per quarter</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl text-[#007AFF] mb-1">$1.2M</div>
                <p className="text-gray-600 text-sm">New pipeline generated in Q1</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                <p className="text-gray-600 leading-relaxed">
                  A Series B SaaS company in the HR tech space had a sales team of 8 SDRs manually prospecting through LinkedIn and ZoomInfo. They were booking around 50 qualified meetings per quarter, but their cost per lead was unsustainable at over $85 per contact. The team was spending more time researching and list-building than actually selling, and email deliverability had dropped below 80% due to poor data quality from their existing provider.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                <p className="text-gray-600 leading-relaxed">
                  They enrolled in <Link href="/pricing" className="text-[#007AFF] hover:underline">Cursive Pipeline</Link>, our full-stack AI SDR solution. Cursive rebuilt their target account list using real-time intent data, set up dedicated email infrastructure with proper warmup protocols, and deployed AI-powered personalization across multi-channel campaigns covering email, LinkedIn, and targeted direct mail to C-suite buyers. The entire setup was completed in three weeks with a dedicated success manager overseeing the transition.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Within 90 days, qualified meetings tripled from 50 to over 150 per quarter. Email deliverability improved to 97% thanks to real-time verification. Cost per lead dropped from $85 to under $12. The sales team redirected 25+ hours per week from prospecting to closing deals. Total new pipeline generated in Q1 exceeded $1.2 million, with a 40% improvement in SQL-to-opportunity conversion rate thanks to better intent-based targeting.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Detailed Case Study 2: Digital Agency */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-[#007AFF]" />
              <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">Digital Marketing Agency</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
              White-Labeled Data Services Added $144K ARR
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl text-[#007AFF] mb-1">12</div>
                <p className="text-gray-600 text-sm">New agency clients acquired</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl text-[#007AFF] mb-1">$144K</div>
                <p className="text-gray-600 text-sm">Annual recurring revenue added</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl text-[#007AFF] mb-1">85%</div>
                <p className="text-gray-600 text-sm">Gross margin on data services</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                <p className="text-gray-600 leading-relaxed">
                  A 30-person digital marketing <Link href="/industries/agencies" className="text-[#007AFF] hover:underline">agency</Link> specializing in B2B clients wanted to expand their service offerings beyond traditional paid media and SEO. Their clients were consistently asking for lead generation and outbound support, but the agency did not have the data infrastructure or expertise to offer these services in-house. They needed a way to offer data-driven lead generation without building the technology from scratch.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                <p className="text-gray-600 leading-relaxed">
                  The agency adopted Cursive's white-label platform, rebranding the data marketplace and outbound tools under their own agency name. They packaged lead data, visitor identification, and email campaign management as premium add-on services for their existing client base. Cursive provided the backend data access, campaign infrastructure, and support, while the agency handled client relationships and strategy.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Within six months, the agency signed 12 clients onto their new data services offering, generating $144,000 in new annual recurring revenue at an 85% gross margin. Client retention improved by 30% because accounts now had more touchpoints with the agency. The average contract value per client increased by $1,200 per month. The agency is now positioning itself as a full-service growth partner rather than just a media buyer.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Detailed Case Study 3: Financial Services */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-[#007AFF]" />
              <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">Financial Services Firm</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
              67% Lower Cost Per Lead, $180K Annual Savings
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl text-[#007AFF] mb-1">67%</div>
                <p className="text-gray-600 text-sm">Reduction in cost per lead</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl text-[#007AFF] mb-1">$180K</div>
                <p className="text-gray-600 text-sm">Annual savings vs previous stack</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl text-[#007AFF] mb-1">2.5x</div>
                <p className="text-gray-600 text-sm">More leads per month</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                <p className="text-gray-600 leading-relaxed">
                  A mid-market <Link href="/industries/financial-services" className="text-[#007AFF] hover:underline">financial services</Link> firm was spending over $250,000 annually on a combination of ZoomInfo licenses and a three-person SDR team. Despite the investment, they were generating only 200 qualified leads per month at a cost of $104 per lead. Data accuracy was a persistent issue, with 15-20% of contacts bouncing or being outdated. The firm needed a more efficient approach that could also meet strict compliance requirements for financial services outreach.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                <p className="text-gray-600 leading-relaxed">
                  The firm transitioned to <Link href="/pricing" className="text-[#007AFF] hover:underline">Cursive Outbound</Link>, replacing both ZoomInfo and one SDR position. Cursive provided real-time verified contact data targeted to financial decision-makers, AI-personalized email sequences referencing industry-specific pain points, and compliant outreach infrastructure with full CAN-SPAM and financial services regulatory adherence. The remaining two SDRs focused exclusively on warm follow-ups and meeting conversions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Cost per lead dropped from $104 to $34, a 67% reduction. Monthly lead volume increased from 200 to 500+ qualified contacts. Annual savings exceeded $180,000 when accounting for the eliminated ZoomInfo license and reduced headcount. Email deliverability improved from 80% to 96%, and the response rate on outbound campaigns doubled. The firm's remaining SDRs reported spending 80% of their time on high-value activities instead of data research.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Detailed Case Study 4: eCommerce */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-[#007AFF]" />
              <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">eCommerce Brand</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
              4.2x ROAS on Visitor Retargeting, $2.1M Attributed Revenue
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl text-[#007AFF] mb-1">4.2x</div>
                <p className="text-gray-600 text-sm">Return on ad spend</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl text-[#007AFF] mb-1">$2.1M</div>
                <p className="text-gray-600 text-sm">Attributed revenue</p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl text-[#007AFF] mb-1">38%</div>
                <p className="text-gray-600 text-sm">Increase in returning customers</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                <p className="text-gray-600 leading-relaxed">
                  A direct-to-consumer <Link href="/industries/ecommerce" className="text-[#007AFF] hover:underline">eCommerce</Link> brand selling premium home goods was driving significant website traffic through paid media, but their conversion rate hovered around 2.5%. Over 97% of visitors were leaving without purchasing, and the brand had no way to identify or re-engage them beyond basic retargeting pixels which only reached a fraction of their audience. Their existing retargeting campaigns were delivering a modest 1.8x ROAS.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                <p className="text-gray-600 leading-relaxed">
                  The brand implemented Cursive's <Link href="/pixel" className="text-[#007AFF] hover:underline">visitor identification pixel</Link> combined with automated retargeting campaigns. The pixel identified 68% of anonymous visitors, resolving them to individual profiles with email addresses and mailing information. Cursive then deployed automated email retargeting sequences triggered by specific browsing behavior, such as viewing product pages multiple times or adding items to cart without purchasing. For high-value visitors, automated direct mail postcards were sent within 48 hours of their visit.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  The retargeting ROAS improved from 1.8x to 4.2x. Total attributed revenue from Cursive-identified visitors reached $2.1 million in the first year. Returning customer rate increased by 38%, and the average order value for retargeted customers was 22% higher than organic purchasers. The email retargeting sequences achieved a 34% open rate and 8.2% click-through rate, far exceeding industry benchmarks. Direct mail postcards drove a 6.5% response rate among high-intent visitors.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Aggregate Results Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
                Aggregate Results Across All Cursive Clients
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                These averages reflect outcomes from over 1,000 B2B companies using Cursive for lead generation, outbound campaigns, and visitor identification.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">95%+</div>
                <p className="text-gray-600 text-sm">Email deliverability rate across all Cursive data</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">3-5x</div>
                <p className="text-gray-600 text-sm">Higher response rates vs traditional cold outreach</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">60-70%</div>
                <p className="text-gray-600 text-sm">Average cost-per-lead reduction in first 90 days</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">2-3 weeks</div>
                <p className="text-gray-600 text-sm">Average time from onboarding to first qualified meeting</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Ready to see what Cursive can do for your pipeline? Start with a <Link href="/free-audit" className="text-[#007AFF] hover:underline">free website visitor audit</Link> or <Link href="/pricing" className="text-[#007AFF] hover:underline">explore our pricing plans</Link>.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" href="/free-audit">
                  Get Free Audit
                </Button>
                <Button size="lg" href="/pricing" variant="outline">
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="Want Results"
        subheadline="Like These?"
        description="Want results like these? Book a call."
      />
    </main>
  )
}
