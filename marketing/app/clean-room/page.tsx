"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function CleanRoomPage() {
  return (
    <main>
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto"
          >
            <span className="text-sm text-[#007AFF] mb-4 block">DATA CLEAN ROOM</span>
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Secure Data Sharing
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                Without Exposure
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Collaborate with partners, match audiences, and unlock insights—all without exposing personal information.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
              Learn More
            </Button>
          </motion.div>
        </Container>
      </section>

      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Secure Partner Joins',
                description: 'Match your data with partner datasets using privacy-preserving joins. No raw PII ever leaves the clean room.',
              },
              {
                title: 'Precision Permissions',
                description: 'Control exactly what data is shared, who can access it, and how it can be used.',
              },
              {
                title: 'Turn Data Into Answers',
                description: 'Run analytics and build reports without exposing underlying personal data.',
              },
              {
                title: 'From Insights to Impact',
                description: 'Export matched audiences directly to ad platforms and activation endpoints.',
              },
              {
                title: 'Cloud-Ready Integration',
                description: 'Connect to Snowflake, BigQuery, Redshift, and other cloud data warehouses.',
              },
              {
                title: 'Compliance Built-In',
                description: 'GDPR, CCPA, and privacy-by-design principles baked into every operation.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Ready to Unlock Partner Data?
            </h2>
            <Button
              size="lg"
              className="bg-white text-[#007AFF] hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
            >
              Schedule a Demo
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
