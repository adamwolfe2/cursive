"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function IntegrationsPage() {
  return (
    <main>
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-5xl mx-auto">
            <span className="text-sm text-[#007AFF] mb-4 block">INTEGRATIONS</span>
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Seamlessly Sync Data
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">With Your Stack</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect Cursive to 200+ platforms or use our API and webhooks for custom integrations.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">View Integrations</Button>
          </motion.div>
        </Container>
      </section>

      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: 'CRM Platforms', examples: 'Salesforce, HubSpot, Pipedrive, Close' },
              { title: 'Ad Platforms', examples: 'Facebook, Google, LinkedIn, TikTok' },
              { title: 'Email Tools', examples: 'Mailchimp, SendGrid, ActiveCampaign' },
              { title: 'Analytics', examples: 'Google Analytics, Segment, Mixpanel' },
              { title: 'Automation', examples: 'Zapier, Make, n8n, webhooks' },
              { title: 'Data Warehouses', examples: 'Snowflake, BigQuery, Redshift' },
            ].map((category, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.examples}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">Need a Custom Integration?</h2>
            <p className="text-lg mb-8 opacity-90">Our team can build custom integrations for your specific needs.</p>
            <Button size="lg" className="bg-white text-[#007AFF] hover:bg-gray-100" href="https://cal.com/adamwolfe/cursive-ai-audit">Contact Us</Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
