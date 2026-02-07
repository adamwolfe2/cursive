"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  ArrowRight, Users, Workflow, CalendarCheck,
  PieChart, Megaphone, BarChart3, Rocket,
  Building2, Layers, CheckCircle2, Shield
} from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

const includedItems = [
  {
    icon: Users,
    title: "Dedicated Team",
    description: "Your own growth strategist, campaign manager, data engineer, and creative lead",
  },
  {
    icon: Workflow,
    title: "Custom Integrations",
    description: "We build custom data pipelines, CRM integrations, and automation workflows",
  },
  {
    icon: CalendarCheck,
    title: "Weekly Strategy",
    description: "Weekly executive strategy sessions with your dedicated growth lead",
  },
  {
    icon: PieChart,
    title: "Full Pipeline Management",
    description: "End-to-end from ICP definition to closed-won attribution",
  },
  {
    icon: Megaphone,
    title: "Multi-Channel Campaigns",
    description: "Email, LinkedIn, SMS, direct mail, and paid media coordinated under one strategy",
  },
  {
    icon: BarChart3,
    title: "Performance Dashboard",
    description: "Custom-built analytics dashboard tracking every metric that matters",
  },
]

const idealFor = [
  {
    icon: Rocket,
    title: "Venture-Backed Startups",
    description: "Companies at $2M-$50M ARR ready to pour fuel on their go-to-market and accelerate growth.",
  },
  {
    icon: Building2,
    title: "Agencies & White-Label Partners",
    description: "Agencies wanting to white-label our entire platform and deliver world-class data and outbound to their clients.",
  },
  {
    icon: Layers,
    title: "Enterprise Teams",
    description: "Enterprise teams replacing 5+ point solutions with a single, unified revenue engine.",
  },
]

export default function VentureStudioPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://meetcursive.com/venture-studio#service",
        "name": "Cursive Venture Studio",
        "description": "White-glove partnership for ambitious companies. Cursive embeds a dedicated team to build, launch, and scale your entire go-to-market. $25,000-$150,000/mo. By application only.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive"
        },
        "serviceType": "Go-to-Market Partnership",
        "areaServed": "Worldwide",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "USD",
          "lowPrice": "25000",
          "highPrice": "150000",
          "offerCount": "1",
          "availability": "https://schema.org/LimitedAvailability"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://meetcursive.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Venture Studio",
            "item": "https://meetcursive.com/venture-studio"
          }
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          {/* Hero Section */}
          <section className="pt-24 pb-20 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-5xl mx-auto"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">VENTURE STUDIO</span>
                <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                  We Build Your{" "}
                  <span className="block font-cursive text-5xl lg:text-7xl mt-2">Revenue Engine</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  White-glove partnership for ambitious companies. We embed a dedicated team to build, launch, and scale your entire go-to-market.
                </p>
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="bg-[#F7F9FB] rounded-2xl px-8 py-4 border border-gray-200 inline-block">
                    <span className="text-3xl lg:text-4xl font-light text-gray-900">$25,000 - $150,000</span>
                    <span className="text-lg text-gray-500 ml-2">/mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#007AFF]" />
                    <span className="text-sm text-[#007AFF] font-medium tracking-wide">BY APPLICATION ONLY</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    href="https://cal.com/adamwolfe/cursive-ai-audit"
                    target="_blank"
                  >
                    Apply for Venture Studio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href="/services">
                    View Other Services
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                  We accept 3-5 new Venture Studio partners per quarter
                </p>
              </motion.div>
            </Container>
          </section>

          {/* What's Included */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  What's Included
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Everything you need to build, launch, and scale your revenue engine -- under one roof
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {includedItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                  >
                    <item.icon className="h-8 w-8 text-[#007AFF] mb-4" />
                    <h3 className="text-xl text-gray-900 mb-3 font-medium">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Who This Is For */}
          <section className="py-20 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Who This Is For
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Venture Studio is designed for companies ready to invest in serious, scalable growth
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {idealFor.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-[#F7F9FB] rounded-2xl p-8 border border-gray-200"
                  >
                    <item.icon className="h-10 w-10 text-[#007AFF] mb-5" />
                    <h3 className="text-2xl text-gray-900 mb-3 font-medium">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* The Venture Studio Difference */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <div className="max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                      The Venture Studio Difference
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      This is not a tool subscription. It's a strategic partnership.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Without */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                      <h3 className="text-xl text-gray-500 mb-6 font-medium">Without Venture Studio</h3>
                      <ul className="space-y-4">
                        {[
                          "5+ tools to manage your GTM stack",
                          "Months to hire a full growth team",
                          "Fragmented data across platforms",
                          "No unified strategy or attribution",
                          "Expensive trial-and-error campaigns",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-600">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* With */}
                    <div className="bg-white rounded-2xl p-8 border-2 border-[#007AFF]">
                      <h3 className="text-xl text-[#007AFF] mb-6 font-medium">With Venture Studio</h3>
                      <ul className="space-y-4">
                        {[
                          "One integrated platform for everything",
                          "Dedicated team embedded in one week",
                          "Unified data and intelligence layer",
                          "Full-funnel strategy with closed-won attribution",
                          "Proven playbooks with rapid iteration",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* Application CTA */}
          <section className="py-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Ready to Build Your
                </h2>
                <p className="font-cursive text-5xl lg:text-6xl text-gray-900 mb-6">
                  Revenue Engine?
                </p>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Apply for Venture Studio. We'll discuss your growth goals, assess fit, and build a custom scope tailored to your business.
                </p>
                <Button
                  size="lg"
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                  className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5"
                >
                  Apply for Venture Studio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-gray-500 mt-6">
                  We accept 3-5 new Venture Studio partners per quarter
                </p>
              </motion.div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Not Ready for"
            subheadline="Venture Studio?"
            description="Explore our other services -- from self-serve lead lists to managed outbound campaigns. There's a Cursive plan for every stage."
            ctaText="View All Services"
            ctaUrl="/services"
          />
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE VENTURE STUDIO</h1>
            <p className="text-gray-700 leading-relaxed">
              White-glove go-to-market partnership for ambitious companies. Cursive embeds a dedicated team to build, launch, and scale your entire revenue engine. Pricing: $25,000-$150,000/month. By application only. 3-5 new partners accepted per quarter.
            </p>
          </div>

          {/* Service Overview */}
          <MachineSection title="Service Overview">
            <p className="text-gray-700 mb-4">
              Cursive Venture Studio is a premium, white-glove partnership that embeds a full growth team into your organization. Unlike tool subscriptions, this is a strategic partnership covering ICP definition, data infrastructure, multi-channel campaigns, pipeline management, and closed-won attribution.
            </p>
            <MachineList items={[
              "Dedicated team: growth strategist, campaign manager, data engineer, creative lead",
              "Custom data pipelines, CRM integrations, and automation workflows",
              "Weekly executive strategy sessions",
              "End-to-end pipeline management from ICP to closed-won",
              "Multi-channel campaigns: email, LinkedIn, SMS, direct mail, paid media",
              "Custom-built performance dashboard"
            ]} />
          </MachineSection>

          {/* What's Included */}
          <MachineSection title="What's Included">
            <MachineList items={[
              {
                label: "Dedicated Team",
                description: "Your own growth strategist, campaign manager, data engineer, and creative lead embedded in your organization"
              },
              {
                label: "Custom Integrations",
                description: "Custom data pipelines, CRM integrations, and automation workflows built for your specific stack"
              },
              {
                label: "Weekly Strategy Sessions",
                description: "Weekly executive strategy sessions with your dedicated growth lead"
              },
              {
                label: "Full Pipeline Management",
                description: "End-to-end from ICP definition to closed-won attribution"
              },
              {
                label: "Multi-Channel Campaigns",
                description: "Email, LinkedIn, SMS, direct mail, and paid media coordinated under one unified strategy"
              },
              {
                label: "Performance Dashboard",
                description: "Custom-built analytics dashboard tracking every metric that matters to your business"
              }
            ]} />
          </MachineSection>

          {/* Who This Is For */}
          <MachineSection title="Ideal Customers">
            <MachineList items={[
              "Venture-backed startups at $2M-$50M ARR ready to accelerate go-to-market",
              "Agencies wanting to white-label the entire Cursive platform for their clients",
              "Enterprise teams replacing 5+ point solutions with a unified revenue engine"
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Venture Studio partnerships range from $25,000 to $150,000 per month depending on scope, team size, and campaign complexity. Pricing is custom-built for each partner based on goals and requirements. By application only.
            </p>
            <MachineList items={[
              "Entry: $25,000/month for focused, single-channel growth",
              "Growth: $50,000-$100,000/month for multi-channel, full-funnel execution",
              "Enterprise: $100,000-$150,000/month for complete GTM transformation",
              "3-5 new partners accepted per quarter"
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Apply">
            <MachineList items={[
              {
                label: "Apply for Venture Studio",
                href: "https://cal.com/adamwolfe/cursive-ai-audit",
                description: "Schedule a call to discuss your growth goals and assess fit"
              },
              {
                label: "View Other Services",
                href: "https://meetcursive.com/services",
                description: "Explore other Cursive services from $1,000/month"
              },
              {
                label: "Website",
                href: "https://meetcursive.com"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
