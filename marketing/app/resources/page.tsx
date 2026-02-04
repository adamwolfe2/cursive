"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { Download, FileText, Calculator, Target, Mail, TrendingUp, CheckCircle, ArrowRight, Book, Video, Headphones } from "lucide-react"

export default function ResourcesPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Free Resources to
              <span className="block font-cursive text-6xl lg:text-7xl text-primary mt-2">
                Scale Your Pipeline
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Templates, guides, and tools to help you build a world-class outbound engine.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Featured Resources */}
      <section className="py-24 bg-white">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Featured Downloads</h2>
            <p className="text-gray-600">Our most popular resources to get you started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 ${resource.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <resource.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{resource.title}</h3>
                    <p className="text-gray-600 mb-4">{resource.description}</p>
                    <ul className="space-y-2 mb-6">
                      {resource.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="w-full">
                      <Download className="w-5 h-5" />
                      Download Free
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Resource Categories */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Browse by
              <span className="block font-cursive text-5xl text-primary mt-2">
                Category
              </span>
            </h2>
            <p className="text-xl text-gray-600">Find exactly what you need</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {resourceCategories.map((category, index) => (
              <div key={category.title}>
                <div className="mb-6 flex items-center gap-3">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">{category.title}</h3>
                </div>

                <div className="space-y-4">
                  {category.resources.map((resource) => (
                    <motion.div
                      key={resource.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {resource.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          <span className="text-xs text-gray-500">{resource.format}</span>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tools & Calculators */}
      <section className="py-24 bg-white">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Free Tools & Calculators</h2>
            <p className="text-gray-600">Interactive tools to plan and optimize your outbound</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className={`w-14 h-14 ${tool.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <tool.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  Launch Tool
                </Button>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Learning Center */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Learning
              <span className="block font-cursive text-5xl text-primary mt-2">
                Center
              </span>
            </h2>
            <p className="text-xl text-gray-600">Master B2B lead generation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-14 h-14 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                <Book className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Guides</h3>
              <p className="text-gray-600 mb-6">
                In-depth written guides on every aspect of outbound.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-sm">
                  <a href="/blog" className="text-primary hover:underline">
                    → Cold Email Best Practices
                  </a>
                </li>
                <li className="text-sm">
                  <a href="/blog" className="text-primary hover:underline">
                    → ICP Definition Framework
                  </a>
                </li>
                <li className="text-sm">
                  <a href="/blog" className="text-primary hover:underline">
                    → Deliverability Optimization
                  </a>
                </li>
              </ul>
              <Button variant="outline" href="/blog">
                View All Guides
              </Button>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
                <Video className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Video Tutorials</h3>
              <p className="text-gray-600 mb-6">
                Watch step-by-step walkthroughs of the platform.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-gray-700">
                  → Platform Tour (8 min)
                </li>
                <li className="text-sm text-gray-700">
                  → Campaign Setup (12 min)
                </li>
                <li className="text-sm text-gray-700">
                  → AI Studio Training (15 min)
                </li>
              </ul>
              <Button variant="outline">
                Watch Videos
              </Button>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center mb-6">
                <Headphones className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Webinars</h3>
              <p className="text-gray-600 mb-6">
                Join live sessions with our experts.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-gray-700">
                  → Scaling Outbound (Monthly)
                </li>
                <li className="text-sm text-gray-700">
                  → Q&A with Founders (Bi-weekly)
                </li>
                <li className="text-sm text-gray-700">
                  → Advanced Tactics (Quarterly)
                </li>
              </ul>
              <Button variant="outline">
                Register Now
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Get New Resources
              <span className="block font-cursive text-5xl lg:text-6xl mt-2">
                Every Week
              </span>
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join 5,000+ B2B leaders getting fresh templates, guides, and strategies.
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
              />
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Put These
              <span className="block font-cursive text-5xl lg:text-6xl text-primary mt-2">
                Into Action?
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our team can implement everything for you—from list building to campaign execution.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
              >
                Book a Strategy Call
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" href="/services">
                View Services
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}

// Featured Resources Data
const featuredResources = [
  {
    title: "Complete ICP Targeting Workbook",
    description: "Define your ideal customer profile with our proven framework used by 500+ companies.",
    icon: Target,
    iconColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    includes: [
      "ICP definition worksheet",
      "Firmographic targeting matrix",
      "Buying persona templates",
      "Market sizing calculator",
    ],
  },
  {
    title: "Cold Email Playbook (2026)",
    description: "50+ proven email templates and sequences that drive replies and meetings.",
    icon: Mail,
    iconColor: "bg-gradient-to-br from-purple-500 to-purple-600",
    includes: [
      "10 high-performing templates",
      "5 complete multi-touch sequences",
      "Subject line formulas",
      "Personalization tactics",
    ],
  },
]

// Resource Categories
const resourceCategories = [
  {
    title: "Templates",
    icon: FileText,
    color: "bg-blue-500",
    resources: [
      {
        name: "Cold Email Templates",
        description: "50+ proven email templates",
        format: "PDF • 24 pages",
      },
      {
        name: "LinkedIn Outreach Scripts",
        description: "Connection requests & messages",
        format: "PDF • 12 pages",
      },
      {
        name: "Follow-up Sequences",
        description: "6-touch cadence templates",
        format: "PDF • 18 pages",
      },
      {
        name: "Discovery Call Framework",
        description: "Question bank for first calls",
        format: "PDF • 8 pages",
      },
    ],
  },
  {
    title: "Guides",
    icon: Book,
    color: "bg-purple-500",
    resources: [
      {
        name: "ICP Targeting Guide",
        description: "5-step framework for perfect targeting",
        format: "PDF • 32 pages",
      },
      {
        name: "Deliverability Optimization",
        description: "Technical setup & best practices",
        format: "PDF • 28 pages",
      },
      {
        name: "Campaign Performance Guide",
        description: "Metrics, benchmarks & optimization",
        format: "PDF • 22 pages",
      },
      {
        name: "Scaling Outbound Playbook",
        description: "Go from 10 to 200+ emails/day",
        format: "PDF • 36 pages",
      },
    ],
  },
  {
    title: "Worksheets",
    icon: CheckCircle,
    color: "bg-green-500",
    resources: [
      {
        name: "ICP Definition Worksheet",
        description: "Define your ideal customer profile",
        format: "Excel • Editable",
      },
      {
        name: "Campaign Planning Template",
        description: "Plan campaigns before launch",
        format: "Excel • Editable",
      },
      {
        name: "A/B Test Tracker",
        description: "Track email variations & results",
        format: "Excel • Editable",
      },
      {
        name: "ROI Calculator",
        description: "Calculate outbound program ROI",
        format: "Excel • Editable",
      },
    ],
  },
]

// Tools
const tools = [
  {
    title: "ROI Calculator",
    description: "Calculate expected ROI from outbound",
    icon: Calculator,
    color: "bg-blue-500",
  },
  {
    title: "Volume Planner",
    description: "Plan your sending volume & cadence",
    icon: TrendingUp,
    color: "bg-purple-500",
  },
  {
    title: "ICP Scorer",
    description: "Score leads against your ICP",
    icon: Target,
    color: "bg-green-500",
  },
  {
    title: "Subject Line Tester",
    description: "Test subject lines for deliverability",
    icon: Mail,
    color: "bg-orange-500",
  },
]
