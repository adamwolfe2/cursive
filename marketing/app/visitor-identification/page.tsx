"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function VisitorIdentificationPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto"
          >
            <span className="text-sm text-[#007AFF] mb-4 block">VISITOR IDENTIFICATION</span>
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Identify, Enrich, and Activate Visitors
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform unknown clicks into valuable contacts. Identify, enrich, and activate visitor data—all while staying compliant.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
              Get Started
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
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

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Reveal Up to <span className="text-[#007AFF]">70%</span> of Anonymous Traffic
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Most visitor identification tools only identify 20-30% of traffic. Cursive's advanced algorithms reveal significantly more.
            </p>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-xl text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light mb-4">
              Ready to Identify Your Visitors?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              See how Cursive can reveal up to 70% of your anonymous traffic.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#007AFF] hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
            >
              Book a Demo
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}

const features = [
  {
    title: 'Instant Visitor Resolution',
    description: 'Turn anonymous visitors into known profiles the moment they land, enriched with trusted attributes.',
  },
  {
    title: 'Smart Prospect Scoring',
    description: 'Pinpoint high-value prospects using firmographic, demographic, and live intent data.',
  },
  {
    title: 'Activate Instantly',
    description: 'Activate audiences instantly—sync to ads, email, or CRM with one click.',
  },
  {
    title: 'Consent-Compliant Data',
    description: 'Stay privacy-first by honoring opt-outs, using hashed IDs, and complying with regional policies.',
  },
  {
    title: 'Intelligent Filtering',
    description: 'Cut wasted spend by filtering out customers, bots, and internal traffic.',
  },
  {
    title: 'Conversion Matchback',
    description: 'Prove ROI by connecting conversions back to identified traffic.',
  },
]

const steps = [
  {
    title: 'Install Pixel',
    description: 'Add a simple JavaScript tag to your website in minutes.',
  },
  {
    title: 'Automatic Identification',
    description: 'Our system identifies visitors in real-time and enriches their profiles.',
  },
  {
    title: 'Activate Everywhere',
    description: 'Sync identified visitors to your CRM, ads platforms, and email tools.',
  },
]
