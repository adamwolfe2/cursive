"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function IntentAudiencesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <div className="text-center max-w-5xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-light text-gray-900 mb-6"
            >
              Syndicated Intent Audiences
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                Ready to Activate
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 mb-8"
            >
              Pre-built intent audiences across high-value verticals, updated every 7 days with fresh users.
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
            {[
              { value: '8', label: 'Verticals' },
              { value: '46+', label: 'Segments' },
              { value: '280M+', label: 'US Profiles' },
              { value: '450B+', label: 'Intent Signals/Month' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200"
              >
                <div className="text-4xl text-[#007AFF] mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Intent Levels */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
            Choose Your Intent Level
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { level: 'Hot (7D)', description: 'Highest intent score - users actively searching in the last 7 days', color: 'from-red-50 to-red-100 border-red-200' },
              { level: 'Warm (14D)', description: 'Expanded reach - users showing interest in the last 14 days', color: 'from-orange-50 to-orange-100 border-orange-200' },
              { level: 'Scale (30D)', description: 'Full-funnel coverage - users with intent signals in the last 30 days', color: 'from-blue-50 to-blue-100 border-blue-200' },
            ].map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${tier.color} rounded-xl p-6 border`}
              >
                <h3 className="text-xl text-gray-900 mb-3">{tier.level}</h3>
                <p className="text-gray-600 text-sm">{tier.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Verticals */}
      <section className="py-20 bg-white">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
            Available Verticals
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              'MedSpa & Aesthetics',
              'GLP-1 & Weight Loss',
              'Home Services',
              'Legal Services',
              'Luxury Goods',
              'Men\'s Health',
              'High-Ticket Recreation',
              'Pickleball',
            ].map((vertical, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:border-[#007AFF] transition-colors"
              >
                <h3 className="text-lg text-gray-900">{vertical}</h3>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Ready to Activate Intent Audiences?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Get access to pre-built segments updated every 7 days.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#007AFF] hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
            >
              Get Started
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
