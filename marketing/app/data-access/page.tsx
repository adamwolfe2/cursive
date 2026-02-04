"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function DataAccessPage() {
  return (
    <main>
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Direct Data Access,
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">On Demand</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">220M+ Consumer Profiles • 140M+ Business Profiles • 30,000+ Intent Categories</p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">Get Started</Button>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
            {[
              { value: '220M+', label: 'Consumer Profiles' },
              { value: '140M+', label: 'Business Profiles' },
              { value: '30,000+', label: 'Intent Categories' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-5xl text-[#007AFF] mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-8">Access the Largest B2B and B2C Database</h2>
            <p className="text-gray-600 mb-12">Query, filter, and export verified contact data on demand. API access, bulk exports, or real-time lookups.</p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">Schedule a Demo</Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
