"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function DirectMailPage() {
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
            <span className="text-sm text-[#007AFF] mb-4 block">DIRECT MAIL</span>
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Direct Mail Remarketing
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                Made Simple
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Turn website visitors into physical touchpoints. Launch automated direct mail campaigns that convert.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
              Get Started
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
            Direct Mail That Actually Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-8 border border-gray-200"
              >
                <h3 className="text-2xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              From Click to Mailbox in 48 Hours
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              Affordable Campaigns at Scale
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Send professional direct mail starting at just $1.50 per piece, including postage and design.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {pricing.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-8 border border-gray-200 text-center"
              >
                <h3 className="text-2xl text-gray-900 mb-2">{tier.type}</h3>
                <div className="text-4xl text-[#007AFF] mb-4">{tier.price}</div>
                <p className="text-gray-600 text-sm">{tier.description}</p>
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
              Launch Your First Direct Mail Campaign
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Turn anonymous website traffic into physical touchpoints that convert.
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

const features = [
  {
    title: 'Filter & Segment',
    description: 'Target visitors by behavior, demographics, and firmographics. Send postcards only to your highest-intent prospects.',
  },
  {
    title: 'Affordable Campaigns',
    description: 'Starting at $1.50 per piece including postage, design, and delivery. No minimum orders.',
  },
  {
    title: 'Automated Retargeting',
    description: 'Trigger direct mail campaigns automatically when visitors take specific actions on your site.',
  },
  {
    title: 'Connect Online to In Person',
    description: 'Bridge the digital-physical gap. Include QR codes, PURLs, and trackable phone numbers.',
  },
]

const steps = [
  {
    title: 'Visitor Identified',
    description: 'Our pixel identifies website visitors in real-time.',
  },
  {
    title: 'Address Matched',
    description: 'We match visitors to verified physical addresses.',
  },
  {
    title: 'Mail Designed',
    description: 'Choose from templates or upload custom designs.',
  },
  {
    title: 'Mail Delivered',
    description: 'Your mail arrives in 48 hours or less.',
  },
]

const pricing = [
  {
    type: 'Postcard',
    price: '$1.50',
    description: '4x6" or 6x9" postcards with full-color printing and postage included.',
  },
  {
    type: 'Letter',
    price: '$2.50',
    description: 'Personalized letters in envelopes with custom inserts.',
  },
  {
    type: 'Package',
    price: 'Custom',
    description: 'Dimensional mail, samples, or custom packages for high-value accounts.',
  },
]
