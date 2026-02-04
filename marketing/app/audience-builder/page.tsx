"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"

export default function AudienceBuilderPage() {
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
            <span className="text-sm text-[#007AFF] mb-4 block">AUDIENCE BUILDER</span>
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Build Limitless Audiences
              <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                With Intent & Identity
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Access live-intent B2B and B2C data, create limitless audiences, and engage across every channel.
            </p>
            <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
              Get Started
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Stats Grid */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center border border-blue-200"
              >
                <div className="text-4xl text-[#007AFF] mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 max-w-2xl mx-auto">
              Build audiences from the largest collection of verified consumer and business data, updated in real-time.
            </p>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <Container>
          <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-12 text-center">
            Powerful Audience Building Features
          </h2>
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

      {/* Use Cases */}
      <section className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              Endless Possibilities
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Build audiences for any marketing channel or use case
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {useCases.map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-lg text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-gray-600 text-sm">{useCase.description}</p>
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
              Ready to Build Your Audience?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Start building limitless audiences with verified B2B and B2C data.
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

const stats = [
  { value: '25,000+', label: 'Categories' },
  { value: '220M+', label: 'Consumer Profiles' },
  { value: '140M+', label: 'Business Profiles' },
]

const features = [
  {
    title: 'Target with Intent & Identity',
    description: 'Combine live intent signals with verified identity data to reach buyers at the perfect moment.',
  },
  {
    title: 'Audiences of Any Size',
    description: 'No caps, no restrictions. Build audiences as large or targeted as you need.',
  },
  {
    title: 'Intelligent Filters',
    description: 'Filter by demographics, firmographics, technographics, and behavioral data.',
  },
  {
    title: 'Consent-Aware Activation',
    description: 'All data honors opt-outs and complies with privacy regulations.',
  },
  {
    title: 'Regulation-Ready',
    description: 'GDPR, CCPA, and regional compliance built in from day one.',
  },
  {
    title: 'Partner-Friendly',
    description: 'Share audiences securely with partners through our data clean room.',
  },
]

const useCases = [
  {
    title: 'Paid Advertising',
    description: 'Upload audiences to Facebook, Google, LinkedIn, and 200+ ad platforms.',
  },
  {
    title: 'Email Marketing',
    description: 'Build verified email lists for cold outreach and nurture campaigns.',
  },
  {
    title: 'Direct Mail',
    description: 'Target prospects with personalized direct mail campaigns.',
  },
  {
    title: 'CRM Enrichment',
    description: 'Enrich existing contacts with fresh firmographic and intent data.',
  },
  {
    title: 'Lookalike Modeling',
    description: 'Find new prospects that match your best customers.',
  },
  {
    title: 'Account-Based Marketing',
    description: 'Build targeted account lists with multiple decision-makers.',
  },
]
