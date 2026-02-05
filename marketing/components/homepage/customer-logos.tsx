"use client"

import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

const companies = [
  "TechCorp",
  "DataSystems",
  "CloudFlow",
  "SalesForce",
  "MarketPro",
  "GrowthLabs",
  "RevEngine",
  "ScaleHQ",
]

export function CustomerLogos() {
  return (
    <section className="py-16 bg-gray-100">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-12">
            Trusted by 500+ B2B companies
          </h2>

          {/* Desktop: 2x4 Grid, Mobile: 2x2 Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-5xl mx-auto">
            {companies.map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-center justify-center"
              >
                <div className="text-2xl lg:text-3xl font-semibold text-gray-400 hover:text-gray-700 transition-colors duration-300 cursor-default select-none tracking-tight">
                  {company}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
