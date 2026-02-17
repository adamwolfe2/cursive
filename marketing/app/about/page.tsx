"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import Link from "next/link"

export default function AboutPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]} />
      </div>
      {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              We Got Tired of Bad Lead Data
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                So We Built Something Better
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              <span className="font-cursive text-2xl text-gray-500">Cursive</span> started because we were tired of paying for lead lists that didn't convert.
              Outdated contacts. Generic emails. No personalization. No results.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-xl text-gray-700 leading-relaxed">
                So we built what we wished existed: verified data, AI-powered outreach, and done-for-you campaigns that actually work.
              </p>

              <p className="text-xl text-gray-700 leading-relaxed">
                Today, <span className="font-cursive text-2xl text-gray-500">Cursive</span> powers pipeline for hundreds of B2B companies—from bootstrapped startups
                to growth-stage companies scaling fast.
              </p>

              <p className="text-xl text-gray-700 leading-relaxed">
                We don't sell software. We sell results.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Our Mission
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Make Lead Gen Effortless
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-700 text-center leading-relaxed mb-12">
              Every company deserves access to high-quality leads without hiring an army of BDRs
              or stitching together 10 tools.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
              >
                <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-light">1</span>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">Buy the Data</h3>
                <p className="text-gray-600">
                  Get verified lead lists and run campaigns yourself
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
              >
                <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-light">2</span>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">Let Us Run It</h3>
                <p className="text-gray-600">
                  Done-for-you campaigns, managed end-to-end
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
              >
                <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-light">3</span>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3">Full Pipeline</h3>
                <p className="text-gray-600">
                  We build your entire pipeline, AI-powered and automated
                </p>
              </motion.div>
            </div>

            <p className="text-center text-xl text-gray-700 mt-12">
              Whatever stage you're at, we meet you there.
            </p>
          </div>
        </Container>
      </section>

      {/* Recursive Intelligence Philosophy */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left: Philosophy Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                {/* Definition block */}
                <div className="border-l-4 border-[#007AFF] pl-6">
                  <p className="text-sm tracking-widest text-gray-400 mb-1">re·cur·sive</p>
                  <p className="text-gray-600 italic">/rəˈkərsiv/ — relating to or involving a process that calls itself, using its own output as its next input.</p>
                </div>

                <h2 className="text-4xl lg:text-5xl font-light text-gray-900">
                  Our Philosophy
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    Recursive Intelligence
                  </span>
                </h2>

                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    We&apos;re betting everything on a simple premise: <strong className="text-gray-900">the companies that learn from their own growth data will outrun the ones that don&apos;t.</strong>
                  </p>
                  <p>
                    Most growth tools give you a static database and say &ldquo;go find leads.&rdquo; That&apos;s a library card. Cursive is different. We built a system that gets smarter every time you use it. Every visitor identified, every audience built, every campaign sent, every deal closed — it all feeds back into the system.
                  </p>
                  <p>
                    The AI doesn&apos;t start from scratch each month. It picks up where last month left off. It remembers which subject lines converted, which industries responded, which signals predicted a deal. Then it compounds.
                  </p>
                </div>

                {/* The Cycle That Compounds */}
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">The Cycle That Compounds</h3>
                  <div className="space-y-3">
                    {[
                      { step: "Identify", desc: "High-intent visitors & engagement signals" },
                      { step: "Enrich", desc: "Turn signals into actionable data & lookalikes" },
                      { step: "Reach", desc: "Multi-channel outreach informed by past wins" },
                      { step: "Convert", desc: "Close deals with messaging that already worked" },
                      { step: "Learn", desc: "Feed insights back into targeting" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-white font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">{item.step}</span>
                          <span className="text-gray-600"> — {item.desc}</span>
                        </div>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-3 pt-2"
                    >
                      <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white">↻</span>
                      </div>
                      <span className="text-gray-900 font-semibold italic">REPEAT SMARTER</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Right: Contrast Grid */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {/* Most Businesses vs Cursive */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-400 tracking-widest mb-4">MOST BUSINESSES</h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li>Buy a lead list</li>
                      <li>Blast generic emails</li>
                      <li>Wonder why nothing converts</li>
                      <li>Buy another list</li>
                      <li>Repeat (without learning)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-[#007AFF] tracking-widest mb-4">CURSIVE BUSINESSES</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                      <li>Identify who&apos;s already interested</li>
                      <li>Enrich with real-time context</li>
                      <li>Reach through channels that work</li>
                      <li>Convert with proven messaging</li>
                      <li>Learn and compound every cycle</li>
                    </ul>
                  </div>
                </div>

                {/* Quote */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                  <p className="text-lg font-light leading-relaxed">
                    &ldquo;While your competitors treat every lead like the first lead they&apos;ve ever gotten, Cursive treats every lead like the thousandth. <em>Because it is.</em>&rdquo;
                  </p>
                  <p className="text-sm text-gray-400 mt-3">The result: your CAC drops, your LTV rises, your growth compounds instead of plateaus.</p>
                </div>

                {/* Caption */}
                <p className="text-sm text-gray-500 text-center leading-relaxed italic">
                  Each cycle through the Cursive system makes the next cycle more efficient. Your first month identifies patterns. Your third month exploits them. Your sixth month? You&apos;re targeting prospects your competitors can&apos;t even see.
                </p>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Our
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Values
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Speed Over Perfection</h3>
              <p className="text-gray-600 leading-relaxed">
                We ship fast, test fast, and iterate fast. Your pipeline can't wait for perfect.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Quality Over Quantity</h3>
              <p className="text-gray-600 leading-relaxed">
                We'd rather send you 100 perfect leads than 10,000 garbage contacts.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Transparency Always</h3>
              <p className="text-gray-600 leading-relaxed">
                No hidden fees. No long contracts. No nonsense.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Who
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                We Are
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're a team of growth operators, data engineers, and AI builders who've lived
              the pain of bad lead gen.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-12 max-w-4xl mx-auto border border-gray-200 text-center">
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Started by founders who were tired of wasting money on bad data and ineffective outbound tools.
              We built <span className="font-cursive text-2xl text-gray-500">Cursive</span> to solve our own problem—then realized every B2B company faces the same challenges.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed">
              Now we're on a mission to make high-quality lead generation accessible to every company,
              regardless of size or budget.
            </p>
          </div>
        </Container>
      </section>

      {/* Technology Approach */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Our Technology
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Approach
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cursive combines best-in-class data infrastructure with AI-powered automation to deliver results that traditional tools simply cannot match.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <h3 className="text-xl font-light text-gray-900 mb-3">AI-Powered Personalization</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI models analyze thousands of data points per contact to generate hyper-personalized outreach. Every email, subject line, and call-to-action is tailored to the recipient's role, company, recent activity, and buying intent. This is not template-based mail merge. It is genuine one-to-one personalization at scale, which is why our clients see 3 to 5 times higher response rates compared to traditional cold email. Learn more about our <Link href="/services" className="text-[#007AFF] hover:underline">outbound services</Link>.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <h3 className="text-xl font-light text-gray-900 mb-3">Real-Time Data Verification</h3>
              <p className="text-gray-600 leading-relaxed">
                Unlike legacy data providers who batch-process records monthly, Cursive verifies every contact at the point of delivery. We cross-reference data from over 200 sources to ensure 95%+ accuracy on every email, phone number, and company record. If anything bounces, we replace it for free. Explore our <Link href="/data-access" className="text-[#007AFF] hover:underline">data access platform</Link> to see the full scope of available data.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <h3 className="text-xl font-light text-gray-900 mb-3">Website Visitor Intelligence</h3>
              <p className="text-gray-600 leading-relaxed">
                Our proprietary <Link href="/pixel" className="text-[#007AFF] hover:underline">visitor identification pixel</Link> identifies up to 70% of anonymous website visitors, revealing not just the company but the specific individual visiting your site. Combined with intent scoring and page-level behavior tracking, you always know which prospects are ready to buy and how to reach them.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <h3 className="text-xl font-light text-gray-900 mb-3">Multi-Channel Orchestration</h3>
              <p className="text-gray-600 leading-relaxed">
                Cursive does not limit you to a single channel. Our platform orchestrates coordinated campaigns across email, LinkedIn, SMS, and direct mail. AI determines the optimal channel mix, timing, and message for each prospect, ensuring your outreach meets buyers wherever they are. See our full <Link href="/platform" className="text-[#007AFF] hover:underline">platform capabilities</Link>.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Remote-First Culture */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Remote-First
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Culture
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cursive is a fully remote company. Our team spans the United States, working from home offices, coffee shops, and co-working spaces. We believe that the best talent is not confined to a single zip code, and we have built our company culture around that principle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-2">Async by Default</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We work asynchronously whenever possible. Clear documentation, recorded walkthroughs, and well-written briefs keep everyone aligned without requiring constant meetings.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-2">Outcome-Driven</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We measure ourselves by the results we deliver, both for our customers and our team. No busywork, no vanity metrics. Everything we build is tied to tangible outcomes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 bg-[#007AFF] rounded-full" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-2">Continuous Learning</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                The data and AI landscape moves fast. Our team invests in staying at the cutting edge, sharing knowledge internally, and applying new techniques to improve the platform every week.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Customer Success Metrics */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Customer
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Success
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We measure our success by the results our clients achieve. Here is what Cursive customers experience on average.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center bg-white rounded-xl p-8 border border-gray-200"
            >
              <div className="text-4xl text-[#007AFF] mb-2">3x</div>
              <p className="text-gray-600 text-sm">Average pipeline increase within 90 days</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center bg-white rounded-xl p-8 border border-gray-200"
            >
              <div className="text-4xl text-[#007AFF] mb-2">95%+</div>
              <p className="text-gray-600 text-sm">Email deliverability rate across all data</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center bg-white rounded-xl p-8 border border-gray-200"
            >
              <div className="text-4xl text-[#007AFF] mb-2">67%</div>
              <p className="text-gray-600 text-sm">Average cost-per-lead reduction vs. traditional methods</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center bg-white rounded-xl p-8 border border-gray-200"
            >
              <div className="text-4xl text-[#007AFF] mb-2">1,000+</div>
              <p className="text-gray-600 text-sm">B2B companies trust Cursive for lead generation</p>
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-6">
              See detailed results from real Cursive clients across SaaS, agencies, financial services, and eCommerce.
            </p>
            <Button size="lg" href="/case-studies" variant="outline">
              View Case Studies
            </Button>
          </div>
        </Container>
      </section>

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="Let's Build Your Pipeline"
        subheadline="Together"
        description="Book a call and we'll show you exactly how Cursive can transform your lead generation."
      />
    </main>
  </HumanView>

  {/* Machine View - AEO-Optimized */}
  <MachineView>
    <MachineContent>
      {/* Header */}
      <div className="mb-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900 font-bold mb-4">ABOUT CURSIVE</h1>
        <p className="text-gray-700 leading-relaxed">
          B2B lead generation platform built by founders frustrated with bad data and ineffective outbound tools. We create AI-powered systems that identify website visitors, build targeted audiences, and automate multi-channel outreach.
        </p>
      </div>

      {/* Company Overview */}
      <MachineSection title="Company Overview">
        <p className="text-gray-700 mb-4">
          Cursive started because we were tired of paying for lead lists that didn't convert. Outdated contacts, generic emails, no personalization, no results. So we built what we wished existed: verified data, AI-powered outreach, and done-for-you campaigns that actually work.
        </p>
        <p className="text-gray-700">
          Today, Cursive powers pipeline for hundreds of B2B companies—from bootstrapped startups to growth-stage companies scaling fast. We don't sell software. We sell results.
        </p>
      </MachineSection>

      {/* Mission */}
      <MachineSection title="Our Mission">
        <p className="text-gray-700 mb-4">
          Make lead generation effortless for every company. Every business deserves access to high-quality leads without hiring an army of BDRs or stitching together 10 tools.
        </p>
        <MachineList items={[
          "Buy the Data - Get verified lead lists and run campaigns yourself",
          "Let Us Run It - Done-for-you campaigns, managed end-to-end",
          "Full Pipeline - We build your entire pipeline, AI-powered and automated"
        ]} />
        <p className="text-gray-700 mt-4">
          Whatever stage you're at, we meet you there.
        </p>
      </MachineSection>

      {/* Recursive Intelligence Philosophy */}
      <MachineSection title="Our Philosophy: Recursive Intelligence">
        <p className="text-gray-700 mb-4">
          Recursive (adjective): relating to or involving a process that calls itself, using its own output as its next input. Cursive is built on the premise that the companies that learn from their own growth data will outrun the ones that don't.
        </p>
        <p className="text-gray-700 mb-4">
          Most growth tools give you a static database and say "go find leads." That's a library card. Cursive built a system that gets smarter every time you use it. Every visitor identified, every audience built, every campaign sent, every deal closed feeds back into the system. The AI doesn't start from scratch each month — it picks up where last month left off, remembering which subject lines converted, which industries responded, which signals predicted a deal. Then it compounds.
        </p>
        <p className="text-gray-700 mb-4">The Cursive recursive cycle:</p>
        <MachineList items={[
          "Identify — High-intent visitors and engagement signals",
          "Enrich — Turn signals into actionable data and lookalikes",
          "Reach — Multi-channel outreach informed by past wins",
          "Convert — Close deals with messaging that already worked",
          "Learn — Feed insights back into targeting",
          "Repeat Smarter — Each cycle compounds on the last"
        ]} />
        <p className="text-gray-700 mt-4">
          Each cycle through the Cursive system makes the next cycle more efficient. Your first month identifies patterns. Your third month exploits them. Your sixth month, you're targeting prospects your competitors can't even see.
        </p>
        <p className="text-gray-700 mt-4">
          While most businesses buy a lead list, blast generic emails, wonder why nothing converts, and repeat without learning — Cursive businesses identify who's already interested, enrich with real-time context, reach through channels that work, convert with proven messaging, and learn and compound every cycle.
        </p>
      </MachineSection>

      {/* Core Values */}
      <MachineSection title="Core Values">
        <div className="space-y-4">
          <div>
            <p className="text-white mb-2">Speed Over Perfection:</p>
            <p className="text-gray-400">We ship fast, test fast, and iterate fast. Your pipeline can't wait for perfect.</p>
          </div>
          <div>
            <p className="text-white mb-2">Quality Over Quantity:</p>
            <p className="text-gray-400">We'd rather send you 100 perfect leads than 10,000 garbage contacts.</p>
          </div>
          <div>
            <p className="text-white mb-2">Transparency Always:</p>
            <p className="text-gray-400">No hidden fees. No long contracts. No nonsense.</p>
          </div>
        </div>
      </MachineSection>

      {/* Team */}
      <MachineSection title="Who We Are">
        <p className="text-gray-700 mb-4">
          We're a team of growth operators, data engineers, and AI builders who've lived the pain of bad lead gen. Started by founders who were tired of wasting money on bad data and ineffective outbound tools.
        </p>
        <p className="text-gray-700">
          We built Cursive to solve our own problem—then realized every B2B company faces the same challenges. Now we're on a mission to make high-quality lead generation accessible to every company, regardless of size or budget.
        </p>
      </MachineSection>

      {/* Technology Approach */}
      <MachineSection title="Technology Approach">
        <p className="text-gray-700 mb-4">
          Cursive combines best-in-class data infrastructure with AI-powered automation to deliver results that traditional lead generation tools cannot match.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 mb-2">AI-Powered Personalization:</p>
            <p className="text-gray-600">AI models analyze thousands of data points per contact to generate hyper-personalized outreach. Every email, subject line, and call-to-action is tailored to the recipient's role, company, recent activity, and buying intent. Clients see 3-5x higher response rates compared to traditional cold email.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Real-Time Data Verification:</p>
            <p className="text-gray-600">Unlike legacy data providers who batch-process records monthly, Cursive verifies every contact at the point of delivery. Data is cross-referenced from over 200 sources to ensure 95%+ accuracy. Bounced emails are replaced for free.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Website Visitor Intelligence:</p>
            <p className="text-gray-600">Proprietary visitor identification pixel identifies up to 70% of anonymous website visitors, revealing not just the company but the specific individual. Combined with intent scoring and page-level behavior tracking.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Multi-Channel Orchestration:</p>
            <p className="text-gray-600">Coordinated campaigns across email, LinkedIn, SMS, and direct mail. AI determines the optimal channel mix, timing, and message for each prospect.</p>
          </div>
        </div>
      </MachineSection>

      {/* Remote-First Culture */}
      <MachineSection title="Company Culture">
        <p className="text-gray-700 mb-4">
          Cursive is a fully remote company headquartered in San Francisco, CA with team members across the United States. We operate on three core cultural principles.
        </p>
        <MachineList items={[
          "Async by Default: Clear documentation, recorded walkthroughs, and well-written briefs keep everyone aligned without constant meetings",
          "Outcome-Driven: We measure ourselves by the results we deliver for customers and team. No busywork, no vanity metrics",
          "Continuous Learning: The data and AI landscape moves fast. The team invests in staying at the cutting edge, sharing knowledge internally, and applying new techniques weekly"
        ]} />
      </MachineSection>

      {/* Customer Success Metrics */}
      <MachineSection title="Customer Success Metrics">
        <p className="text-gray-700 mb-4">
          Cursive measures success by the results clients achieve. Average outcomes across the customer base include:
        </p>
        <MachineList items={[
          "3x average pipeline increase within 90 days",
          "95%+ email deliverability rate across all data",
          "67% average cost-per-lead reduction vs traditional methods",
          "1,000+ B2B companies trust Cursive for lead generation",
          "4.2x ROAS on visitor retargeting campaigns",
          "$2 per lead vs $50 industry average"
        ]} />
      </MachineSection>

      {/* Related Pages */}
      <MachineSection title="Learn More About Cursive">
        <MachineList items={[
          {
            label: "Case Studies",
            href: "https://www.meetcursive.com/case-studies",
            description: "See real, anonymized results from Cursive clients across SaaS, agencies, financial services, and eCommerce"
          },
          {
            label: "Platform Overview",
            href: "https://www.meetcursive.com/platform",
            description: "Explore the full Cursive platform and its capabilities"
          },
          {
            label: "Data Access",
            href: "https://www.meetcursive.com/data-access",
            description: "Learn about our 220M+ consumer profiles and 140M+ business profiles"
          },
          {
            label: "Pricing",
            href: "https://www.meetcursive.com/pricing",
            description: "View transparent pricing for all plans and services"
          }
        ]} />
      </MachineSection>

      {/* Contact */}
      <MachineSection title="Contact">
        <MachineList items={[
          {
            label: "Schedule a Call",
            href: "https://cal.com/cursive/30min",
            description: "Book a personalized demo to see how Cursive can transform your lead generation"
          },
          {
            label: "Website",
            href: "https://www.meetcursive.com"
          },
          {
            label: "Email",
            href: "mailto:hello@meetcursive.com"
          }
        ]} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>
  )
}
