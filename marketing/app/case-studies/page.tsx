"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { TrendingUp, Shield, Target, ShoppingCart, Check, ArrowRight, Zap, Users, BarChart3, Clock } from "lucide-react"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

export default function CaseStudiesPage() {
  return (
    <main className="overflow-hidden">
      <HumanView>
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
                Real results from real companies using Cursive&apos;s intent data, audience targeting, and identity resolution to drive measurable growth.
              </p>
              <Button
                size="lg"
                href="https://cal.com/cursive/30min"
                className="bg-[#007AFF] hover:bg-[#0066DD]"
              >
                Get Results Like These
                <ArrowRight className="w-5 h-5 ml-2" />
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
                <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">AI SaaS Company</div>
                <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">40x ROI in 30 days</h3>
                <p className="text-gray-600 text-sm text-center">
                  $250K ad spend generated $11M in revenue using intent-based audience targeting
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <Shield className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
                <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">Insurtech App</div>
                <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">5x CPC reduction</h3>
                <p className="text-gray-600 text-sm text-center">
                  Precision targeting slashed cost-per-click and generated 1,200+ qualified leads
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
                <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">Medical Technology</div>
                <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">$24M pipeline in 3 days</h3>
                <p className="text-gray-600 text-sm text-center">
                  600+ qualified leads from 60K medical professionals using intent targeting
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <ShoppingCart className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
                <div className="text-sm text-[#007AFF] font-medium mb-2 text-center">E-Commerce Brand</div>
                <h3 className="text-2xl text-gray-900 mb-3 text-center font-light">$200K in 90 days</h3>
                <p className="text-gray-600 text-sm text-center">
                  Identity resolution drove 500 new customers with 80% email open rates
                </p>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Case Study 1: AI SaaS - $11M in 30 Days */}
        <section className="py-24 bg-white">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-[#007AFF]" />
                <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">AI SaaS Company</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                $11M in 30 Days: How an AI SaaS Company Supercharged Growth
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                  <div className="text-3xl text-[#007AFF] mb-1">40x</div>
                  <p className="text-gray-600 text-sm">Return on investment</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                  <div className="text-3xl text-[#007AFF] mb-1">$11M</div>
                  <p className="text-gray-600 text-sm">Revenue generated in 30 days</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                  <div className="text-3xl text-[#007AFF] mb-1">50%</div>
                  <p className="text-gray-600 text-sm">Lead quality improvement</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                  <p className="text-gray-600 leading-relaxed">
                    An AI SaaS company, offering tools for advertisers and agencies, faced challenges in targeting specific industries through paid ads. They needed to identify prospects with both the intent to adopt AI technologies and the financial capacity for 12-month subscriptions -- a task that proved difficult with conventional targeting methods.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Cursive&apos;s <Link href="/intent-audiences" className="text-[#007AFF] hover:underline">intent audience builder</Link> was deployed to pinpoint agencies above a certain revenue threshold. This data was then cross-referenced with Cursive&apos;s pre-built segment for AI technologies and voice model product searches. The resulting high-intent audience was synced daily to the client&apos;s ad platforms, ensuring consistently fresh and relevant targeting data.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The campaign produced extraordinary results in just 30 days. From a $250,000 ad spend, the client generated over $11 million in revenue -- a staggering 40x return on investment. Lead quality improved by 50%, with higher conversion rates and lower cost per qualified lead, demonstrating the power of precision in B2B targeting.
                  </p>
                </div>
              </div>

              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Key Benefits</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Precision B2B Targeting</strong> -- Granular targeting based on company size, revenue, and specific intent signals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Dynamic Audience Syncing</strong> -- Daily updates ensured ads always reached current, high-intent prospects</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Improved Lead Quality</strong> -- Focusing on intent and qualification delivered leads more likely to convert</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Exceptional ROI</strong> -- 40x return demonstrating the power of data-driven campaign targeting</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Case Study 2: Insurtech - 5x CPC Reduction */}
        <section className="py-24 bg-[#F7F9FB]">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-[#007AFF]" />
                <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">Insurtech App</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                Precision Targeting Triumph: How an Insurtech App Slashed CPC by 5x
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl text-[#007AFF] mb-1">5x</div>
                  <p className="text-gray-600 text-sm">CPC reduction vs previous campaigns</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl text-[#007AFF] mb-1">2.24%</div>
                  <p className="text-gray-600 text-sm">Click-through rate achieved</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl text-[#007AFF] mb-1">1,200+</div>
                  <p className="text-gray-600 text-sm">Qualified leads in 90 days</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                  <p className="text-gray-600 leading-relaxed">
                    A consumer-focused Insurtech app faced the challenge of targeting a niche market for their specialty auto coverage product. They needed to precisely identify and reach their ideal audience at the lowest possible cost, preferably when prospects were actively researching insurance options. Traditional targeting methods were proving inefficient and costly.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Cursive deployed a multi-faceted approach to solve this targeting puzzle. We utilized our <Link href="/custom-audiences" className="text-[#007AFF] hover:underline">pre-built intent segment</Link> for insurance keywords and behaviors, then layered specific demographic parameters to further refine the audience. This highly targeted group was synced directly to the client&apos;s ad platforms via Cursive&apos;s audience sync feature, ensuring fresh data was pushed daily for optimal relevance and timing.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The campaign dramatically improved the client&apos;s marketing efficiency. Cost Per Click (CPC) was reduced by 5x compared to their initial campaigns. Click-Through Rate (CTR) soared to an impressive 2.24%. Over 1,200 qualified leads were generated within 90 days. These results demonstrate the power of precise, intent-based targeting in reaching niche markets efficiently.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Key Benefits</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Precision Targeting</strong> -- Pre-built segments and layered targeting for pinpoint accuracy in niche audiences</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Cost Efficiency</strong> -- High-intent prospect focus significantly reduced wasted ad spend</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Fresh, Dynamic Data</strong> -- Daily syncing ensured campaigns always leveraged current intent signals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Scalable Lead Generation</strong> -- Steady stream of qualified leads even in specialized markets</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Case Study 3: Medical Technology - $24M Pipeline */}
        <section className="py-24 bg-white">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-[#007AFF]" />
                <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">Medical Technology</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                Generating a $24M Pipeline: B2B Lead Generation for Medical Technology
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                  <div className="text-3xl text-[#007AFF] mb-1">$24M</div>
                  <p className="text-gray-600 text-sm">Pipeline value generated</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                  <div className="text-3xl text-[#007AFF] mb-1">600+</div>
                  <p className="text-gray-600 text-sm">Quality leads produced</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                  <div className="text-3xl text-[#007AFF] mb-1">3 days</div>
                  <p className="text-gray-600 text-sm">From setup to results</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                  <p className="text-gray-600 leading-relaxed">
                    A medical device company, selling high-ticket equipment starting at $40,000, struggled to target their niche audience -- medical professionals using specific diagnostic testing equipment -- through traditional ads. This precision targeting challenge hindered their ability to reach qualified leads efficiently.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Cursive&apos;s <Link href="/custom-audiences" className="text-[#007AFF] hover:underline">custom audience builder</Link> was deployed, utilizing the client&apos;s competitor list and ideal keywords. The system identified user profiles actively searching for &ldquo;diagnostic medical equipment&rdquo; within a 24-hour period. Cursive&apos;s intent targeting then filtered for medical professionals only. This highly targeted audience was directly synced to the client&apos;s outbound B2B team for immediate follow-up.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The campaign generated remarkable results in just three days. From a list of 60,000 medical professionals, over 600 quality leads were produced -- each willing to join a product demo. This translated into an impressive pipeline value exceeding $24 million, demonstrating the power of precise, intent-based targeting in the B2B space.
                  </p>
                </div>
              </div>

              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Key Benefits</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Precision Targeting</strong> -- Custom models pinpoint exactly who&apos;s in-market, even in niche B2B sectors</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Rapid Deployment</strong> -- From setup to results in just 3 days without sacrificing quality</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Scalable Pipeline</strong> -- Transform raw data into millions in potential revenue with intent-based targeting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Cross-Platform Integration</strong> -- Seamlessly sync high-quality leads to sales teams for immediate action</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Case Study 4: E-Commerce - $200K in 90 Days */}
        <section className="py-24 bg-[#F7F9FB]">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="w-8 h-8 text-[#007AFF]" />
                <span className="text-sm text-[#007AFF] font-medium uppercase tracking-wide">E-Commerce Brand</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                Unlocking $200K in 90 Days: E-Commerce Success with Identity Resolution
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl text-[#007AFF] mb-1">$200K+</div>
                  <p className="text-gray-600 text-sm">Additional revenue in 90 days</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl text-[#007AFF] mb-1">80%</div>
                  <p className="text-gray-600 text-sm">Email open rate achieved</p>
                </div>
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-3xl text-[#007AFF] mb-1">500</div>
                  <p className="text-gray-600 text-sm">New customers acquired</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Challenge</h3>
                  <p className="text-gray-600 leading-relaxed">
                    An e-commerce brand struggled with low match rates using their existing identity resolution platform. This bottleneck hampered their ability to effectively target and re-engage potential customers, leaving significant revenue on the table and stalling growth initiatives.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Cursive Solution</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The <Link href="/pixel" className="text-[#007AFF] hover:underline">Cursive Pixel</Link> was seamlessly integrated into the client&apos;s website. This advanced tool leveraged intent-based identity resolution, dramatically improving match rates by 20% over the previous solution, reaching an impressive 60% overall. Identified visitors were automatically enrolled in personalized reactivation email sequences.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">The Results</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The impact was immediate and substantial. The client saw an 80% email open rate and a 40% click-through rate. Within 90 days, the reactivation sequence generated 500 new customers with an average order value of $280. Most importantly, this translated to over $200,000 in additional revenue.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wide">Key Benefits</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Superior Match Rates</strong> -- Cursive Pixel consistently outperforms competitors with more accurate customer data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Rapid ROI</strong> -- $200K revenue boost in just three months from identity resolution alone</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Enhanced Engagement</strong> -- 80% open rates and 40% CTR demonstrate precise, intent-based targeting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">Scalable Growth</strong> -- Unlock previously unreachable audiences for accelerated expansion</span>
                  </div>
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
                  Why Companies Choose Cursive
                </h2>
                <p className="text-gray-600 max-w-3xl mx-auto">
                  Across industries, our clients see measurable improvements in targeting accuracy, lead quality, and campaign ROI.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                  <Zap className="w-8 h-8 text-[#007AFF] mx-auto mb-3" />
                  <div className="text-3xl text-[#007AFF] mb-2">40x</div>
                  <p className="text-gray-600 text-sm">Best-in-class ROI from intent-based audience targeting</p>
                </div>
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                  <Clock className="w-8 h-8 text-[#007AFF] mx-auto mb-3" />
                  <div className="text-3xl text-[#007AFF] mb-2">3 days</div>
                  <p className="text-gray-600 text-sm">Fastest time from setup to qualified pipeline results</p>
                </div>
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                  <Users className="w-8 h-8 text-[#007AFF] mx-auto mb-3" />
                  <div className="text-3xl text-[#007AFF] mb-2">60%+</div>
                  <p className="text-gray-600 text-sm">Identity resolution match rates across e-commerce clients</p>
                </div>
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                  <BarChart3 className="w-8 h-8 text-[#007AFF] mx-auto mb-3" />
                  <div className="text-3xl text-[#007AFF] mb-2">5x</div>
                  <p className="text-gray-600 text-sm">Average CPC improvement with precision targeting</p>
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
          description="Book a call to see how Cursive can drive measurable growth for your business."
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Cursive Case Studies - Customer Results & Metrics</h1>

          <p className="text-gray-700 mb-6">
            Real results from real companies using Cursive&apos;s intent data, audience targeting, and identity resolution to drive measurable growth. Four detailed case studies across AI SaaS, Insurtech, Medical Technology, and E-Commerce industries.
          </p>

          <MachineSection title="Results Summary">
            <MachineList items={[
              "AI SaaS Company: 40x ROI, $11M revenue from $250K ad spend in 30 days, 50% lead quality improvement",
              "Insurtech App: 5x CPC reduction, 2.24% CTR, 1,200+ qualified leads in 90 days",
              "Medical Technology: $24M pipeline value, 600+ quality leads from 60K professionals, results in 3 days",
              "E-Commerce Brand: $200K+ additional revenue in 90 days, 80% email open rate, 500 new customers",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 1: AI SaaS Company - 40x ROI">
            <p className="text-gray-700 mb-3">
              Challenge: An AI SaaS company needed to target specific industries through paid ads, identifying prospects with intent to adopt AI technologies and financial capacity for 12-month subscriptions.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: Cursive&apos;s intent audience builder pinpointed agencies above revenue thresholds, cross-referenced with AI technology intent segments. High-intent audiences synced daily to ad platforms.
            </p>
            <p className="text-gray-700 mb-3">
              Results: $250K ad spend generated $11M revenue (40x ROI) in 30 days. Lead quality improved 50% with higher conversion rates and lower cost per qualified lead.
            </p>
            <MachineList items={[
              "Precision B2B targeting based on company size, revenue, and intent signals",
              "Dynamic audience syncing with daily updates",
              "50% improvement in lead quality",
              "40x return on investment",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 2: Insurtech App - 5x CPC Reduction">
            <p className="text-gray-700 mb-3">
              Challenge: Consumer-focused Insurtech app needed to target a niche market for specialty auto coverage at the lowest possible cost when prospects were actively researching insurance.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: Cursive deployed pre-built intent segments for insurance keywords, layered with demographic parameters. Targeted audience synced directly to ad platforms daily.
            </p>
            <p className="text-gray-700 mb-3">
              Results: CPC reduced 5x vs. previous campaigns. CTR reached 2.24%. 1,200+ qualified leads generated in 90 days.
            </p>
            <MachineList items={[
              "Pre-built intent segments for niche targeting",
              "5x cost-per-click reduction",
              "2.24% click-through rate",
              "1,200+ qualified leads in 90 days",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 3: Medical Technology - $24M Pipeline">
            <p className="text-gray-700 mb-3">
              Challenge: Medical device company selling $40K+ equipment struggled to target medical professionals using specific diagnostic testing equipment through traditional ads.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: Cursive&apos;s custom audience builder used competitor lists and ideal keywords to identify profiles searching for diagnostic medical equipment within 24 hours. Intent targeting filtered for medical professionals only.
            </p>
            <p className="text-gray-700 mb-3">
              Results: From 60,000 medical professionals, 600+ quality leads produced in just 3 days. Pipeline value exceeded $24M.
            </p>
            <MachineList items={[
              "Custom intent models for niche B2B sectors",
              "3-day time to results",
              "600+ quality leads from 60K professional pool",
              "$24M pipeline value generated",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 4: E-Commerce - $200K in 90 Days">
            <p className="text-gray-700 mb-3">
              Challenge: E-commerce brand had low match rates with existing identity resolution platform, leaving revenue on the table.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: Cursive Pixel integrated into the website improved match rates by 20% over previous solution (60% overall). Identified visitors enrolled in personalized reactivation email sequences.
            </p>
            <p className="text-gray-700 mb-3">
              Results: 80% email open rate, 40% CTR, 500 new customers with $280 average order value, $200K+ additional revenue in 90 days.
            </p>
            <MachineList items={[
              "60% identity resolution match rate",
              "80% email open rate, 40% CTR",
              "500 new customers acquired",
              "$200K+ additional revenue in 90 days",
            ]} />
          </MachineSection>

          <MachineSection title="Aggregate Performance Metrics">
            <MachineList items={[
              "Best-in-class ROI: Up to 40x from intent-based audience targeting",
              "Fastest deployment: Results in as few as 3 days from setup",
              "Identity resolution: 60%+ match rates across e-commerce clients",
              "CPC improvement: Average 5x reduction with precision targeting",
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Products Used">
            <MachineList items={[
              { label: "Intent Audience Builder", href: "/intent-audiences", description: "Build custom intent-based audiences for ad targeting" },
              { label: "Custom Audiences", href: "/custom-audiences", description: "Pre-built intent segments and layered demographic targeting" },
              { label: "Cursive Pixel", href: "/pixel", description: "Identity resolution with 60%+ match rates" },
              { label: "Platform Overview", href: "/platform", description: "Full visitor identification and lead generation platform" },
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Book a Demo", href: "https://cal.com/cursive/30min", description: "See how Cursive can drive results for your business" },
              { label: "Free Website Visitor Audit", href: "/free-audit", description: "See which companies are visiting your site right now" },
              { label: "Pricing", href: "/pricing", description: "Explore self-serve and done-for-you plans" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
