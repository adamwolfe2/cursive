"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function EducationPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Education', url: 'https://meetcursive.com/industries/education' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Industries", href: "/industries" },
            { name: "Education", href: "/industries/education" },
          ]} />
        </div>
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <div className="max-w-5xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[#007AFF] mb-4 block"
              >
                INDUSTRY SOLUTIONS
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-light text-gray-900 mb-6"
              >
                Education Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Student recruitment and enrollment marketing for colleges, universities, and online education providers.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
                  Schedule a Strategy Call
                </Button>
              </motion.div>
            </div>
          </Container>
        </section>

        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-12 text-center">
              Why Choose Cursive for Education
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="text-xl text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Industry Insights */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Education Resources & Insights
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for student recruitment and enrollment marketing
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Omni-Channel Retargeting Strategies",
                  description: "Coordinate student recruitment campaigns across multiple touchpoints.",
                  href: "/blog/retargeting"
                },
                {
                  title: "Guide to Direct Mail Marketing Automation",
                  description: "Automate personalized direct mail to prospective students and parents.",
                  href: "/blog/direct-mail"
                },
                {
                  title: "B2B Audience Targeting Explained",
                  description: "Target decision-makers for corporate training and B2B education programs.",
                  href: "/blog/audience-targeting"
                },
                {
                  title: "How to Identify Website Visitors: Technical Guide",
                  description: "Identify prospective students visiting your institution's website.",
                  href: "/blog/how-to-identify-website-visitors-technical-guide"
                },
                {
                  title: "Tips for Improving CRM Integration Workflows",
                  description: "Optimize your student CRM and marketing automation workflows.",
                  href: "/blog/crm-integration"
                },
                {
                  title: "How Marketing Data Solutions Improve Campaigns",
                  description: "Leverage data to improve student recruitment campaign performance.",
                  href: "/blog/analytics"
                }
              ].map((resource, i) => (
                <motion.a
                  key={i}
                  href={resource.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="block bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all group"
                >
                  <h3 className="text-lg text-gray-900 mb-2 font-medium group-hover:text-[#007AFF] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 text-[#007AFF] text-sm font-medium flex items-center gap-2">
                    Read article <span>→</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </Container>
        </section>

        <section className="relative py-32 bg-[#F7F9FB] overflow-hidden">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center relative z-10 mb-16"
            >
              <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
                Ready to Grow Your
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Student Pipeline?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Identify prospective students and families with intent data and automated outreach campaigns.
              </p>

              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
              >
                Book Your Strategy Call Now
              </Button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Student targeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Parent outreach</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Enrollment boost</span>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-6xl mx-auto"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <DashboardPreview />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F7F9FB] via-[#F7F9FB]/80 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
    </HumanView>

    {/* Machine View - AEO-Optimized */}
    <MachineView>
      <MachineContent>
        {/* Header */}
        <div className="mb-12 pb-6 border-b border-gray-200">
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR EDUCATION</h1>
          <p className="text-gray-700 leading-relaxed">
            Student recruitment and enrollment marketing platform for colleges, universities, online education providers, and K-12 schools. Identify prospective students and families with verified contact data.
          </p>
        </div>

        {/* Education Solutions */}
        <MachineSection title="Solutions for Education">
          <MachineList items={[
            {
              label: "Student Targeting",
              description: "Reach prospective students by age, grade level, academic interests, and career aspirations"
            },
            {
              label: "Parent Audiences",
              description: "Target parents of college-bound students with messaging about programs and financial aid"
            },
            {
              label: "Career & Interest Targeting",
              description: "Identify students interested in specific degree programs, majors, or career paths"
            },
            {
              label: "Geographic Recruitment",
              description: "Target students in specific regions or states to optimize recruitment budgets"
            }
          ]} />
        </MachineSection>

        {/* Benefits */}
        <MachineSection title="Benefits">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Increase Enrollment:</p>
              <p className="text-gray-400">
                Reach qualified prospects with intent data and multi-touch campaigns that drive applications and enrollment.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Lower Cost per Enrollment:</p>
              <p className="text-gray-400">
                Replace expensive lead gen services with verified, direct-to-student outreach at a fraction of the cost.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Prove Attribution:</p>
              <p className="text-gray-400">
                Track student interactions from first touch to enrollment and measure campaign ROI across all channels.
              </p>
            </div>

            <div>
              <p className="text-white mb-2">Multi-Channel Campaigns:</p>
              <p className="text-gray-400">
                Nurture prospects through the enrollment funnel with email, social ads, direct mail, and retargeting.
              </p>
            </div>
          </div>
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Common Use Cases">
          <MachineList items={[
            "Student recruitment campaigns for undergraduate programs",
            "Graduate program enrollment marketing",
            "Online course and continuing education promotion",
            "Parent outreach for K-12 private schools",
            "International student recruitment",
            "Transfer student targeting"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Get Started">
          <MachineList items={[
            {
              label: "Schedule Strategy Call",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Discuss student recruitment goals and pricing"
            },
            {
              label: "Contact Sales",
              href: "https://meetcursive.com/contact",
              description: "Get custom pricing for education institutions"
            }
          ]} />
        </MachineSection>

      </MachineContent>
    </MachineView>
  </>
  )
}

const benefits = [
  {
    title: 'Student Targeting',
    description: 'Reach prospective students by age, grade level, academic interests, and career aspirations.',
  },
  {
    title: 'Parent Audiences',
    description: 'Target parents of college-bound students with messaging about programs, financial aid, and outcomes.',
  },
  {
    title: 'Career & Interest Targeting',
    description: 'Identify students interested in specific degree programs, majors, or career paths.',
  },
  {
    title: 'Multi-Touch Campaigns',
    description: 'Nurture prospects through the enrollment funnel with email, social ads, direct mail, and retargeting.',
  },
  {
    title: 'Enrollment Attribution',
    description: 'Track student interactions from first touch to enrollment and measure campaign ROI.',
  },
  {
    title: 'Geographic Targeting',
    description: 'Target students in specific regions, states, or markets to optimize recruitment budgets.',
  },
]
