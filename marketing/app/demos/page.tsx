"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { InteractiveFeaturesShowcase } from "@/components/demos/interactive-features-showcase"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

export default function DemosPage() {
  return (
    <main className="bg-white">
      <HumanView>
        {/* Hero Section */}
        <section className="pt-24 pb-12 bg-white">
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
                  className="w-2 h-2 rounded-full bg-[#007AFF]"
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
                  href="https://cal.com/cursive/30min"
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
        <DashboardCTA
          headline="Ready to See It"
          subheadline="In Your Account?"
          description="Book a personalized walkthrough and see how these features work with your actual data and workflows."
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Cursive Interactive Demos - Experience the Platform</h1>

          <p className="text-gray-700 mb-6">
            12 interactive demos showcasing Cursive&apos;s complete platform capabilities. Explore visitor identification, data enrichment, AI-powered outreach, analytics, and more -- all with live interactive previews.
          </p>

          <MachineSection title="Demo Categories Overview">
            <MachineList items={[
              "Core Features (4 demos): Visitor tracking, intent signals, audience building",
              "Engagement Tools (3 demos): AI-powered campaigns, email validation",
              "Analytics (3 demos): Pipeline metrics, attribution, account intelligence",
              "Data & Tools (2 demos): People search, lead marketplace",
            ]} />
          </MachineSection>

          <MachineSection title="Core Feature Demos">
            <MachineList items={[
              { label: "Visitor Identification", href: "/visitor-identification", description: "See how Cursive identifies anonymous website visitors in real-time with 70% match rates, revealing company name, job title, email, and pages viewed" },
              { label: "Intent Signals Dashboard", href: "/platform", description: "Track buying signals across your website -- pricing page visits, feature comparisons, return visits, and content downloads scored by intent level" },
              { label: "Audience Builder", href: "/audience-builder", description: "Build custom audiences from identified visitors, filter by industry, company size, intent score, and behavior patterns for targeted campaigns" },
              { label: "Custom Audiences", href: "/custom-audiences", description: "Access pre-built intent segments and layer demographic parameters for precision ad targeting across platforms" },
            ]} />
          </MachineSection>

          <MachineSection title="Engagement Tool Demos">
            <MachineList items={[
              { label: "AI SDR Campaigns", href: "/platform", description: "Automated AI-powered email sequences personalized to each visitor's behavior, pages viewed, and company profile" },
              { label: "Email Validation", href: "/platform", description: "Real-time email verification ensuring deliverability before outreach, reducing bounce rates and protecting sender reputation" },
              { label: "Direct Mail Automation", href: "/direct-mail", description: "Trigger personalized direct mail campaigns based on digital visitor behavior for multi-channel engagement" },
            ]} />
          </MachineSection>

          <MachineSection title="Analytics Demos">
            <MachineList items={[
              { label: "Pipeline Metrics", href: "/platform", description: "Track visitor-to-lead-to-opportunity conversion across your entire funnel with real-time pipeline attribution" },
              { label: "Multi-Touch Attribution", href: "/platform", description: "Understand which touchpoints and channels drive the most qualified leads and revenue" },
              { label: "Account Intelligence", href: "/platform", description: "Company-level dashboards showing engagement trends, key contacts, intent signals, and recommended actions" },
            ]} />
          </MachineSection>

          <MachineSection title="Data & Tools Demos">
            <MachineList items={[
              { label: "People Search", href: "/marketplace", description: "Search across millions of B2B contacts by job title, company, industry, and location for targeted prospecting" },
              { label: "Lead Marketplace", href: "/marketplace", description: "Access pre-built lists of in-market buyers filtered by intent signals, industry, and company attributes" },
            ]} />
          </MachineSection>

          <MachineSection title="Book a Live Demo">
            <p className="text-gray-700 mb-3">
              Want to see these features with your actual data? Book a personalized 30-minute walkthrough with the Cursive team. We&apos;ll show you real visitors on your website and demonstrate the full platform workflow.
            </p>
            <MachineList items={[
              { label: "Book a Live Demo", href: "https://cal.com/cursive/30min", description: "30-minute personalized walkthrough with your data" },
              { label: "Platform Overview", href: "/platform", description: "Full platform capabilities and features" },
              { label: "Pricing", href: "/pricing", description: "Self-serve and done-for-you plans" },
              { label: "Case Studies", href: "/case-studies", description: "See results from real customers" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
