"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export default function B2BSoftwarePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'B2B Software', url: 'https://meetcursive.com/industries/b2b-software' },
      ])} />
      <main>
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
                B2B Software Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Lead generation for SaaS and B2B software companies. Identify in-market buyers and accelerate pipeline growth.
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
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
              Why Choose Cursive for <span className="font-cursive text-5xl">B2B Software</span>
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

        <section className="py-20 bg-white">
          <Container>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-light mb-4">
                Ready to Accelerate Your Pipeline Growth?
              </h2>
              <Button
                size="lg"
                className="bg-white text-[#007AFF] hover:bg-gray-100"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
              >
                Book a Strategy Call
              </Button>
            </div>
          </Container>
        </section>
      </main>
    </>
  )
}

const benefits = [
  {
    title: 'Product-Market Fit Targeting',
    description: 'Identify companies that match your ideal customer profile based on industry, size, and technology usage.',
  },
  {
    title: 'Intent Data for Software Buyers',
    description: 'Reach prospects actively researching software solutions in your category with buying intent signals.',
  },
  {
    title: 'Account-Based Marketing',
    description: 'Build and activate account lists with verified decision-maker contacts at target companies.',
  },
  {
    title: 'Technographic Filtering',
    description: 'Target companies using specific technologies, tools, or platforms that indicate fit and readiness.',
  },
  {
    title: 'Integration with Sales Tools',
    description: 'Seamlessly push enriched leads to your CRM, marketing automation, and sales engagement tools.',
  },
  {
    title: 'Pipeline Attribution',
    description: 'Track leads from first touch to closed-won and prove the ROI of your marketing programs.',
  },
]
