"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, Mail, Sparkles, Users, Target, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Container className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-primary rounded-full text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Lead Generation
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-6xl lg:text-7xl font-bold mb-6">
              <span className="block text-foreground">
                AI Intent Systems
              </span>
              <span className="block font-[var(--font-great-vibes)] text-7xl lg:text-8xl text-primary mt-2">
                That Never Sleep.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              <span className="font-semibold text-foreground">Cursive</span> identifies real people actively searching for your service, enriches them with verified contact data, and activates them through automated outbound.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="https://calendly.com/your-link" target="_blank">
                Free AI Audit
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" href="/services">
                View Services
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div>
                <div className="text-4xl font-bold text-primary">500M+</div>
                <div className="text-sm text-gray-600 mt-1">Verified Contacts</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">99%</div>
                <div className="text-sm text-gray-600 mt-1">Data Accuracy</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">24/7</div>
                <div className="text-sm text-gray-600 mt-1">AI Agents Active</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-20 relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Interactive Dashboard Demo</p>
                  <p className="text-sm text-gray-500 mt-2">Live preview coming soon</p>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Enterprise Features, Startup Speed */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              Enterprise Features
              <span className="block font-[var(--font-great-vibes)] text-6xl text-primary mt-2">
                Startup Speed
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              Every visitor identified,
              <span className="block font-[var(--font-great-vibes)] text-6xl text-primary mt-2">
                enriched, and scored
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-6">
              Cursive pixel sits above your site, identifies anonymous visitors, enriches with contact data,
              and triggers intent scoring. Feeds data directly into your CRM—no manual data entry.
              The intelligence layer learns from every session.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Target className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-gray-600">Intent Scoring Visualization</p>
                <p className="text-sm text-gray-500 mt-2">See how visitors are tracked and scored</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-12 text-center">
            <Button size="lg" href="https://calendly.com/your-link" target="_blank">
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Container>
      </section>

      {/* How Our AI Agents Solve Your Problems */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              How Our AI Agents
              <span className="block font-[var(--font-great-vibes)] text-6xl text-primary mt-2">
                Solve Your Problems
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Connect Your Stack */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-gray-200"
            >
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Connect Your Stack</h3>
              <p className="text-gray-600 mb-6">
                We sit above your existing tools, CRM, website, and existing tools & platforms.
                Embed our pixel, provide ICP data, share your existing CRM, and we start aggregating.
                Takes 1-2 days. You don't migrate, we unify.
              </p>
              <Button variant="outline" href="https://calendly.com/your-link" target="_blank">
                Free AI Audit
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Right: AI System Diagram */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-gray-600">AI Agent Workflow</p>
                  <p className="text-sm text-gray-500 mt-2">See how data flows through the system</p>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Services Overview - Get Them All in One */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              Forget Separate Tools
              <span className="block font-[var(--font-great-vibes)] text-6xl text-primary mt-2">
                Get Them All in One
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" href="/services">
              Learn More
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Unlock Your Intelligence Layer
              <span className="block font-[var(--font-great-vibes)] text-5xl lg:text-6xl mt-2">
                With Cursive
              </span>
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Cursive exists to give AI accelerators and venture studios the revenue intelligence they need to make deals close faster. You don't migrate, we unify.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              href="https://calendly.com/your-link"
              target="_blank"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </Container>
      </section>
    </main>
  )
}

// Features Data
const features = [
  {
    icon: Users,
    title: "Pixel Lead Tracking",
    description: "Uncover site visitors between people, businesses.",
  },
  {
    icon: Target,
    title: "Database Reconciliation",
    description: "Go beyond surface searches by analyzing competitors.",
  },
  {
    icon: BarChart3,
    title: "Buyer Intent",
    description: "Collect site visitors & run retargeting directly to leads.",
  },
  {
    icon: Mail,
    title: "Multitouch Outreach",
    description: "Capture site visitors and run retargeting campaigns.",
  },
]

// Services Data
const services = [
  {
    icon: Users,
    name: "Lead Tracking",
    description: "Uncover site visitors: people, businesses.",
  },
  {
    icon: Target,
    name: "Deep ICP Scanning",
    description: "Go beyond surface searches by analyzing competitors.",
  },
  {
    icon: BarChart3,
    name: "Buyer Intent",
    description: "Capture site visitors & run retargeting directly to leads.",
  },
  {
    icon: Sparkles,
    name: "Fluent Voice Agents",
    description: "Multilingual support for global users.",
  },
  {
    icon: Mail,
    name: "Voice-to-Text",
    description: "Adaptive responses based on user history and behavior.",
  },
  {
    icon: Zap,
    name: "Multimodal Input",
    description: "Support for text, voice, and image-based queries.",
  },
  {
    icon: Target,
    name: "Real-Time Alerts",
    description: "Stay ahead of threats with instant notifications.",
  },
  {
    icon: Users,
    name: "Conversational AI",
    description: "NLP-based chatbot that understands.",
  },
]
