"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"

export default function EcommercePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://meetcursive.com' },
        { name: 'Industries', url: 'https://meetcursive.com/industries' },
        { name: 'eCommerce', url: 'https://meetcursive.com/industries/ecommerce' },
      ])} />
      <main>
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <div className="max-w-5xl mx-auto">
              <span className="text-sm text-[#007AFF] mb-4 block">INDUSTRY SOLUTIONS</span>
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">eCommerce Marketing Solutions</h1>
              <p className="text-lg text-gray-600 mb-8">Turn anonymous visitors into customers. Identify shoppers, build high-intent audiences, and activate across channels.</p>
              <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">Get Started</Button>
            </div>
          </Container>
        </section>

        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
              Why Choose Cursive for <span className="font-cursive text-5xl">eCommerce</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Visitor Identification', description: 'Identify up to 70% of anonymous website visitors—turn browsers into buyers.' },
                { title: 'Cart Abandonment Recovery', description: 'Target cart abandoners with personalized email, ads, and direct mail.' },
                { title: 'Lookalike Audiences', description: 'Find new customers that match your best buyers across 220M+ consumer profiles.' },
                { title: 'Multi-Channel Retargeting', description: 'Activate audiences on Facebook, Google, TikTok, email, and direct mail.' },
                { title: 'Purchase Intent Data', description: 'Target shoppers actively searching for products in your category.' },
                { title: 'Customer Enrichment', description: 'Enrich existing customer data with demographics, interests, and behaviors.' },
              ].map((benefit, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-6 border border-gray-200">
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
              <h2 className="text-4xl lg:text-5xl font-light mb-4">Ready to Boost Your eCommerce Revenue?</h2>
              <Button size="lg" className="bg-white text-[#007AFF] hover:bg-gray-100" href="https://cal.com/adamwolfe/cursive-ai-audit">Get Started</Button>
            </div>
          </Container>
        </section>
      </main>
    </>
  )
}
