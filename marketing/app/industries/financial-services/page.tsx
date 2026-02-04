"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export default function FinancialServicesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'Financial Services', url: 'https://meetcursive.com/industries/financial-services' },
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
                Financial Services Marketing Solutions
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8"
              >
                Custom data strategies for banks & financial institutions. Accelerate prospecting, cut CAC, and prove attribution with verified B2B data.
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
              Why Choose Cursive for <span className="font-cursive text-5xl">Financial Services</span>
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
                Ready to Transform Your Financial Services Marketing?
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
    title: 'Compliance-First Data',
    description: 'GDPR, CCPA, and financial services regulations baked into every dataset.',
  },
  {
    title: 'Investor & Borrower Targeting',
    description: 'Reach qualified investors, borrowers, and high-net-worth individuals with precision.',
  },
  {
    title: 'Account-Based Marketing',
    description: 'Target businesses and decision-makers at financial institutions and corporations.',
  },
  {
    title: 'Intent Data for Finance',
    description: 'Identify prospects actively researching loans, investments, insurance, and banking products.',
  },
  {
    title: 'Verified Contact Data',
    description: 'Access verified emails, phone numbers, and physical addresses for outreach.',
  },
  {
    title: 'Secure Data Handling',
    description: 'Bank-grade security and encryption for all data transfers and storage.',
  },
]
