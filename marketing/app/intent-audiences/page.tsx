"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Target, Zap, TrendingUp, CheckCircle2, ArrowRight,
  Clock, Database, RefreshCw, Filter, Users, Sparkles,
  BarChart3, Globe, Layers, Mail, MessageSquare, Shield,
  Flame, Rocket
} from "lucide-react"
import { DashboardPreview } from "@/components/dashboard-preview"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function IntentAudiencesPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/intent-audiences#product",
        "name": "Cursive Intent Audiences",
        "description": "Pre-built intent audience segments across 8 high-value verticals. Access 280M+ US profiles with 450B+ monthly intent signals. Updated every 7 days.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://meetcursive.com/intent-audiences",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "category": "Intent Data Platform"
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
            "name": "Intent Audiences",
            "item": "https://meetcursive.com/intent-audiences"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What are intent audiences?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Intent audiences are pre-built segments of people actively researching specific products or services. We track 450B+ monthly intent signals to identify prospects showing purchase intent across 8 high-value verticals."
            }
          },
          {
            "@type": "Question",
            "name": "How fresh is the intent data?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Intent audiences are updated every 7 days with fresh users. Our signals are tracked in real-time, so you're always reaching prospects at peak interest."
            }
          },
          {
            "@type": "Question",
            "name": "Which verticals are available?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer 8 high-value verticals: MedSpa & Aesthetics, GLP-1 & Weight Loss, Home Services, Legal Services, Luxury Goods, Men's Health, High-Ticket Recreation, and Pickleball. Each vertical includes 5-8 specific segments."
            }
          },
          {
            "@type": "Question",
            "name": "What are the different intent levels?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer three intent levels: Hot (7-day window, highest intent), Warm (14-day window, expanded reach), and Scale (30-day window, full-funnel coverage). Choose based on your campaign goals."
            }
          },
          {
            "@type": "Question",
            "name": "How do I activate these audiences?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "One-click activation to 200+ platforms including Facebook Ads, Google Ads, LinkedIn Ads, email platforms, and CRMs. Audiences sync automatically to your connected tools."
            }
          },
          {
            "@type": "Question",
            "name": "Can I combine intent audiences with custom filters?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Start with a pre-built intent audience and layer on additional filters like location, income, age, or other demographics to refine your targeting."
            }
          },
          {
            "@type": "Question",
            "name": "How large are these audiences?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Audience sizes vary by vertical and intent level. Hot audiences are smaller (thousands to tens of thousands) while Scale audiences can reach hundreds of thousands. We show estimated sizes before activation."
            }
          },
          {
            "@type": "Question",
            "name": "Is the data compliant with privacy regulations?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. All intent data honors opt-outs and complies with GDPR, CCPA, and regional privacy laws. We use consent-aware activation and hashed identifiers."
            }
          },
          {
            "@type": "Question",
            "name": "Can I request custom verticals?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. If your industry isn't covered by our standard verticals, we can build custom intent audiences tailored to your specific needs. Contact us for custom vertical requests."
            }
          },
          {
            "@type": "Question",
            "name": "How quickly can I launch a campaign?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Immediately. Select your vertical, choose your intent level, and activate to your preferred platforms. Pre-built audiences eliminate the need for manual list building."
            }
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
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Intent Audiences", href: "/intent-audiences" },
          ]} />
        </div>
        {/* Hero Section */}
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-5xl mx-auto"
            >
              <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">INTENT AUDIENCES</span>
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                Reach Buyers When They're Ready to Purchase
              </h1>
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                Pre-built audience segments across 8 high-value verticals. 280M+ US profiles tracked with 450B+ monthly intent signals. Updated every 7 days with fresh, in-market prospects.
              </p>
              <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                Skip the manual list building. Launch campaigns in minutes with audiences already showing purchase intent. No research, no guessing—just ready-to-convert prospects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
                  Explore Intent Audiences
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href="/pricing">
                  See Pricing
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>8 high-value verticals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>46+ segments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Updated every 7 days</span>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Stats Grid */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { value: '8', label: 'Verticals', icon: Layers },
                { value: '46+', label: 'Segments', icon: Filter },
                { value: '280M+', label: 'US Profiles', icon: Users },
                { value: '450B+', label: 'Intent Signals/Month', icon: Sparkles },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-8 text-center border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <stat.icon className="h-10 w-10 text-[#007AFF] mx-auto mb-3" />
                  <div className="text-4xl text-[#007AFF] mb-2 font-light">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Launch Campaigns in Minutes, Not Days
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From intent signal to active campaign in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Choose Your Vertical",
                  description: "Select from 8 high-value verticals like MedSpa, Home Services, Legal Services, or GLP-1. Each includes 5-8 specific segments.",
                  icon: Target
                },
                {
                  step: "2",
                  title: "Select Intent Level",
                  description: "Hot (7D) for highest intent, Warm (14D) for expanded reach, or Scale (30D) for full-funnel coverage. Preview audience sizes.",
                  icon: TrendingUp
                },
                {
                  step: "3",
                  title: "Activate to Platforms",
                  description: "One-click sync to Facebook, Google, LinkedIn, email, or CRM. Audiences update automatically every 7 days with fresh prospects.",
                  icon: Zap
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#F7F9FB] border border-gray-200 flex items-center justify-center mb-6">
                      <step.icon className="h-10 w-10 text-gray-700" />
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-3 font-medium">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Intent Levels */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Choose Your Intent Level
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Match audience freshness to your campaign goals
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  level: 'Hot (7D)',
                  description: 'Highest intent prospects actively searching in the last 7 days. Smallest audience, highest conversion.',
                  icon: Flame,
                  bestFor: 'High-ticket offers, immediate conversions, limited ad budgets',
                  size: 'Thousands'
                },
                {
                  level: 'Warm (14D)',
                  description: 'Expanded reach with users showing interest in the last 14 days. Balance of intent and scale.',
                  icon: TrendingUp,
                  bestFor: 'Standard campaigns, lead generation, nurture sequences',
                  size: 'Tens of thousands'
                },
                {
                  level: 'Scale (30D)',
                  description: 'Full-funnel coverage with intent signals from the last 30 days. Maximum reach and impressions.',
                  icon: Rocket,
                  bestFor: 'Brand awareness, retargeting, top-of-funnel prospecting',
                  size: 'Hundreds of thousands'
                },
              ].map((tier, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4"><tier.icon className="w-10 h-10 text-[#007AFF]" /></div>
                  <h3 className="text-2xl text-gray-900 mb-3 font-medium">{tier.level}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{tier.description}</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Best for:</div>
                        <div className="text-sm text-gray-600">{tier.bestFor}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="h-5 w-5 text-[#007AFF] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Typical size:</div>
                        <div className="text-sm text-gray-600">{tier.size}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Available Verticals */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                8 High-Value Verticals
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Pre-built segments across industries with strong purchase intent
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  vertical: 'MedSpa & Aesthetics',
                  description: 'People researching Botox, fillers, laser treatments, skin rejuvenation, and aesthetic procedures.',
                  segments: ['Botox Seekers', 'Laser Hair Removal', 'Facial Treatments', 'Body Contouring', 'Anti-Aging']
                },
                {
                  vertical: 'GLP-1 & Weight Loss',
                  description: 'Users actively searching for Ozempic, Wegovy, Mounjaro, weight loss programs, and medical solutions.',
                  segments: ['GLP-1 Medications', 'Medical Weight Loss', 'Bariatric Surgery', 'Diet Programs', 'Supplements']
                },
                {
                  vertical: 'Home Services',
                  description: 'Homeowners researching HVAC, roofing, plumbing, landscaping, and home improvement projects.',
                  segments: ['HVAC Replacement', 'Roof Repair', 'Kitchen Remodel', 'Landscaping', 'Solar Installation']
                },
                {
                  vertical: 'Legal Services',
                  description: 'Individuals seeking personal injury, family law, estate planning, and business legal services.',
                  segments: ['Personal Injury', 'Divorce Attorneys', 'Estate Planning', 'Business Formation', 'Immigration']
                },
                {
                  vertical: 'Luxury Goods',
                  description: 'High-income consumers shopping for luxury watches, jewelry, designer fashion, and premium products.',
                  segments: ['Luxury Watches', 'Fine Jewelry', 'Designer Handbags', 'Exotic Cars', 'Private Aviation']
                },
                {
                  vertical: "Men's Health",
                  description: 'Men researching testosterone therapy, ED treatments, hair loss solutions, and wellness services.',
                  segments: ['TRT Clinics', 'ED Treatments', 'Hair Restoration', 'Fitness Coaching', 'Hormone Optimization']
                },
                {
                  vertical: 'High-Ticket Recreation',
                  description: 'Affluent consumers shopping for boats, RVs, motorcycles, golf memberships, and luxury recreation.',
                  segments: ['Boat Buyers', 'RV Shoppers', 'Golf Members', 'Motorcycle Buyers', 'Luxury Travel']
                },
                {
                  vertical: 'Pickleball',
                  description: 'Players seeking equipment, lessons, court memberships, tournaments, and pickleball communities.',
                  segments: ['Equipment Buyers', 'Lesson Seekers', 'Court Memberships', 'Tournament Players', 'Apparel']
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-8 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                >
                  <h3 className="text-2xl text-gray-900 mb-3 font-medium">
                    {item.vertical}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">Available Segments:</div>
                    <div className="flex flex-wrap gap-2">
                      {item.segments.map((segment, j) => (
                        <span key={j} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-full border border-gray-200">
                          {segment}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Who Uses Intent Audiences
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real scenarios from marketers using pre-built intent segments
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  audience: "MedSpa Owners",
                  scenario: "You're spending thousands on Facebook ads targeting broad demographics like 'women 35-55.' Most clicks don't convert because they're not actively researching treatments.",
                  solution: "Switch to Cursive's MedSpa intent audiences. Reach only people actively searching for Botox, fillers, or laser treatments in the last 7 days. Your CPL drops 60% because you're targeting in-market buyers, not browsers."
                },
                {
                  audience: "Home Service Companies",
                  scenario: "You run seasonal campaigns for HVAC replacement but can't identify which homeowners actually need service until they call.",
                  solution: "Activate the HVAC Replacement Hot audience during peak season. Reach homeowners actively Googling 'AC replacement cost' and 'best HVAC companies near me.' Convert prospects before competitors even reach them."
                },
                {
                  audience: "Weight Loss Clinics",
                  scenario: "GLP-1 demand is exploding but you're competing with every med spa and telehealth company. Paid ads are expensive and crowded.",
                  solution: "Target the GLP-1 Medications intent audience with offers for consultations and treatment plans. Reach patients already educated on Ozempic and Wegovy—skip the awareness phase and close faster."
                },
                {
                  audience: "Luxury Brands",
                  scenario: "High-net-worth shoppers don't respond to standard retargeting. You need to reach affluent buyers when they're actively shopping for luxury goods.",
                  solution: "Activate Luxury Watches or Fine Jewelry intent audiences. Reach consumers researching Rolex, Patek Philippe, or Cartier. Target them with exclusive offers and VIP experiences while they're in buying mode."
                }
              ].map((useCase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-gray-200"
                >
                  <div className="text-sm text-[#007AFF] font-medium mb-2">FOR {useCase.audience.toUpperCase()}</div>
                  <h3 className="text-2xl text-gray-900 mb-4 font-medium">
                    {useCase.scenario}
                  </h3>
                  <div className="border-l-4 border-gray-200 pl-4 mt-4">
                    <p className="text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">How Cursive helps:</strong> {useCase.solution}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Why Intent Audiences Outperform Standard Targeting
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Stop targeting demographics. Start targeting behavior.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: TrendingUp,
                  title: "Higher Conversion Rates",
                  description: "Intent-based audiences convert 2-4x better than demographic targeting. You're reaching people actively researching, not passive browsers."
                },
                {
                  icon: Clock,
                  title: "Launch Campaigns Instantly",
                  description: "No manual list building or audience research. Select a segment and launch in minutes. Pre-built audiences eliminate weeks of prep work."
                },
                {
                  icon: RefreshCw,
                  title: "Always Fresh Data",
                  description: "Audiences update every 7 days with new in-market prospects. Unlike static lists that go stale, you're always reaching active buyers."
                },
                {
                  icon: Target,
                  title: "Precise Behavioral Targeting",
                  description: "Based on actual search and content consumption, not guessed interests. We track what people search for, not what they clicked once."
                },
                {
                  icon: BarChart3,
                  title: "Lower Customer Acquisition Cost",
                  description: "Targeting in-market buyers reduces wasted ad spend. Higher match rates and relevance scores mean lower CPMs and CPCs."
                },
                {
                  icon: Shield,
                  title: "Privacy-Compliant Signals",
                  description: "All intent data honors opt-outs and complies with GDPR/CCPA. We use aggregated, anonymized signals—not individual tracking."
                },
                {
                  icon: Layers,
                  title: "Combine with Custom Filters",
                  description: "Start with intent and layer on geography, demographics, or firmographics. Stack filters for hyper-targeted segments."
                },
                {
                  icon: Globe,
                  title: "Multi-Channel Activation",
                  description: "Use the same intent audience across Facebook, Google, LinkedIn, email, and direct mail. Consistent targeting across channels."
                }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                >
                  <benefit.icon className="h-8 w-8 text-[#007AFF] mb-4" />
                  <h3 className="text-xl text-gray-900 mb-3 font-medium">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Integrations */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <IntegrationsShowcase
              title="Activate to Every Marketing Platform"
              subtitle="One-click sync to 200+ ad platforms, CRMs, and email tools"
            />
            <div className="text-center mt-8">
              <Button variant="outline" href="/integrations">
                View All Integrations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Container>
        </section>


        {/* FAQ */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {[
                {
                  question: "What are intent audiences?",
                  answer: "Intent audiences are pre-built segments of people actively researching specific products or services. We track 450B+ monthly intent signals to identify prospects showing purchase intent across 8 high-value verticals."
                },
                {
                  question: "How fresh is the intent data?",
                  answer: "Intent audiences are updated every 7 days with fresh users. Our signals are tracked in real-time, so you're always reaching prospects at peak interest."
                },
                {
                  question: "Which verticals are available?",
                  answer: "We offer 8 high-value verticals: MedSpa & Aesthetics, GLP-1 & Weight Loss, Home Services, Legal Services, Luxury Goods, Men's Health, High-Ticket Recreation, and Pickleball. Each vertical includes 5-8 specific segments."
                },
                {
                  question: "What are the different intent levels?",
                  answer: "We offer three intent levels: Hot (7-day window, highest intent), Warm (14-day window, expanded reach), and Scale (30-day window, full-funnel coverage). Choose based on your campaign goals."
                },
                {
                  question: "How do I activate these audiences?",
                  answer: "One-click activation to 200+ platforms including Facebook Ads, Google Ads, LinkedIn Ads, email platforms, and CRMs. Audiences sync automatically to your connected tools."
                },
                {
                  question: "Can I combine intent audiences with custom filters?",
                  answer: "Yes. Start with a pre-built intent audience and layer on additional filters like location, income, age, or other demographics to refine your targeting."
                },
                {
                  question: "How large are these audiences?",
                  answer: "Audience sizes vary by vertical and intent level. Hot audiences are smaller (thousands to tens of thousands) while Scale audiences can reach hundreds of thousands. We show estimated sizes before activation."
                },
                {
                  question: "Is the data compliant with privacy regulations?",
                  answer: "Yes. All intent data honors opt-outs and complies with GDPR, CCPA, and regional privacy laws. We use consent-aware activation and hashed identifiers."
                },
                {
                  question: "Can I request custom verticals?",
                  answer: "Yes. If your industry isn't covered by our standard verticals, we can build custom intent audiences tailored to your specific needs. Contact us for custom vertical requests."
                },
                {
                  question: "How quickly can I launch a campaign?",
                  answer: "Immediately. Select your vertical, choose your intent level, and activate to your preferred platforms. Pre-built audiences eliminate the need for manual list building."
                }
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="text-lg text-gray-900 mb-3 font-medium">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Learn More About Intent Data
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Master intent-based marketing with these expert guides
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Buyer Intent-Based Audience Segmentation Techniques",
                  description: "Target ready-to-buy prospects using behavioral intent signals.",
                  href: "/blog/38-buyer-intent-based-audience-segmentation-techniques-UPDATED"
                },
                {
                  title: "Understanding the Impact of Buyer Intent on Campaigns",
                  description: "Learn how intent data transforms campaign performance and ROI.",
                  href: "/blog/29-understanding-the-impact-of-buyer-intent-on-campaigns"
                },
                {
                  title: "Intent Signal Tracking for B2B Marketing",
                  description: "Track and act on buyer signals before competitors do.",
                  href: "/blog/40-intent-signal-tracking-for-b2b-marketing"
                },
                {
                  title: "Intent-Based Marketing Tactics for B2B",
                  description: "Practical strategies for implementing intent-driven campaigns.",
                  href: "/blog/41-intent-based-marketing-tactics-for-b2b"
                },
                {
                  title: "Understanding Data-Driven Retargeting Practices",
                  description: "Use intent data to power smarter retargeting campaigns.",
                  href: "/blog/05-understanding-data-driven-retargeting-practices"
                },
                {
                  title: "Tips for Finding Data Targeting Solutions That Work",
                  description: "Choose the right intent data platform for your needs.",
                  href: "/blog/13-tips-for-finding-data-targeting-solutions-that-work-UPDATED"
                }
              ].map((resource, i) => (
                <motion.a
                  key={i}
                  href={resource.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="block bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all group"
                >
                  <h3 className="text-lg text-gray-900 mb-2 font-medium group-hover:text-[#007AFF] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 text-[#007AFF] text-sm font-medium flex items-center gap-2">
                    Read article <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.a>
              ))}
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="relative py-32 bg-white overflow-hidden">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center relative z-10 mb-16"
            >
              <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
                Ready to Reach
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                In-Market Buyers?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Pre-built intent audiences across 8 high-value verticals. Launch campaigns in minutes with prospects already showing purchase intent.
              </p>

              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
              >
                Explore Intent Audiences Now
              </Button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Updated every 7 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>46+ segments</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Instant activation</span>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-6xl mx-auto"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <DashboardPreview />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
    </HumanView>

    {/* Machine View - AEO-Optimized */}
    <MachineView>
      <MachineContent>
        {/* Header */}
        <div className="mb-12 pb-6 border-b border-gray-200">
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE INTENT AUDIENCES</h1>
          <p className="text-gray-700 leading-relaxed">
            Pre-built audience segments across 8 high-value verticals. Access 280M+ US profiles with 450B+ monthly intent signals. Updated every 7 days with fresh, in-market prospects.
          </p>
        </div>

        {/* Overview */}
        <MachineSection title="Product Overview">
          <p className="text-gray-700 mb-4">
            Intent audiences are pre-built segments of people actively researching specific products or services. We track 450B+ monthly intent signals to identify prospects showing purchase intent across 8 high-value verticals. Skip manual list building and launch campaigns in minutes with ready-to-convert prospects.
          </p>
          <MachineList items={[
            "8 high-value verticals with 46+ specific segments",
            "280M+ US profiles tracked with real-time intent signals",
            "Updated every 7 days with fresh in-market buyers",
            "Three intent levels: Hot (7D), Warm (14D), Scale (30D)",
            "One-click activation to 200+ platforms"
          ]} />
        </MachineSection>

        {/* How It Works */}
        <MachineSection title="How It Works">
          <MachineList items={[
            "Choose Your Vertical - Select from 8 high-value verticals like MedSpa, Home Services, Legal Services, or GLP-1. Each includes 5-8 specific segments",
            "Select Intent Level - Hot (7D) for highest intent, Warm (14D) for expanded reach, or Scale (30D) for full-funnel coverage. Preview audience sizes",
            "Activate to Platforms - One-click sync to Facebook, Google, LinkedIn, email, or CRM. Audiences update automatically every 7 days with fresh prospects"
          ]} />
        </MachineSection>

        {/* Intent Levels */}
        <MachineSection title="Intent Levels">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Hot (7D):</p>
              <p className="text-gray-400">Highest intent prospects actively searching in the last 7 days. Smallest audience, highest conversion. Best for high-ticket offers, immediate conversions, limited ad budgets.</p>
            </div>
            <div>
              <p className="text-white mb-2">Warm (14D):</p>
              <p className="text-gray-400">Expanded reach with users showing interest in the last 14 days. Balance of intent and scale. Best for standard campaigns, lead generation, nurture sequences.</p>
            </div>
            <div>
              <p className="text-white mb-2">Scale (30D):</p>
              <p className="text-gray-400">Full-funnel coverage with intent signals from the last 30 days. Maximum reach and impressions. Best for brand awareness, retargeting, top-of-funnel prospecting.</p>
            </div>
          </div>
        </MachineSection>

        {/* Available Verticals */}
        <MachineSection title="Available Verticals">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">MedSpa & Aesthetics:</p>
              <p className="text-gray-400">Botox Seekers, Laser Hair Removal, Facial Treatments, Body Contouring, Anti-Aging</p>
            </div>
            <div>
              <p className="text-white mb-2">GLP-1 & Weight Loss:</p>
              <p className="text-gray-400">GLP-1 Medications, Medical Weight Loss, Bariatric Surgery, Diet Programs, Supplements</p>
            </div>
            <div>
              <p className="text-white mb-2">Home Services:</p>
              <p className="text-gray-400">HVAC Replacement, Roof Repair, Kitchen Remodel, Landscaping, Solar Installation</p>
            </div>
            <div>
              <p className="text-white mb-2">Legal Services:</p>
              <p className="text-gray-400">Personal Injury, Divorce Attorneys, Estate Planning, Business Formation, Immigration</p>
            </div>
            <div>
              <p className="text-white mb-2">Luxury Goods:</p>
              <p className="text-gray-400">Luxury Watches, Fine Jewelry, Designer Handbags, Exotic Cars, Private Aviation</p>
            </div>
            <div>
              <p className="text-white mb-2">Men's Health:</p>
              <p className="text-gray-400">TRT Clinics, ED Treatments, Hair Restoration, Fitness Coaching, Hormone Optimization</p>
            </div>
            <div>
              <p className="text-white mb-2">High-Ticket Recreation:</p>
              <p className="text-gray-400">Boat Buyers, RV Shoppers, Golf Members, Motorcycle Buyers, Luxury Travel</p>
            </div>
            <div>
              <p className="text-white mb-2">Pickleball:</p>
              <p className="text-gray-400">Equipment Buyers, Lesson Seekers, Court Memberships, Tournament Players, Apparel</p>
            </div>
          </div>
        </MachineSection>

        {/* Key Benefits */}
        <MachineSection title="Key Benefits">
          <MachineList items={[
            "Higher Conversion Rates - Intent-based audiences convert 2-4x better than demographic targeting",
            "Launch Instantly - No manual list building. Select a segment and launch in minutes",
            "Always Fresh Data - Audiences update every 7 days with new in-market prospects",
            "Precise Behavioral Targeting - Based on actual search and content consumption, not guessed interests",
            "Lower CAC - Targeting in-market buyers reduces wasted ad spend",
            "Privacy-Compliant - All intent data honors opt-outs and complies with GDPR/CCPA",
            "Combine with Filters - Layer on geography, demographics, or firmographics for hyper-targeting",
            "Multi-Channel Activation - Use same intent audience across all marketing channels"
          ]} />
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Use Cases">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">MedSpa Owners:</p>
              <p className="text-gray-400">Target only people actively searching for Botox, fillers, or laser treatments in the last 7 days. CPL drops 60% by targeting in-market buyers, not browsers.</p>
            </div>
            <div>
              <p className="text-white mb-2">Home Service Companies:</p>
              <p className="text-gray-400">Reach homeowners actively Googling 'AC replacement cost' during peak season. Convert prospects before competitors reach them.</p>
            </div>
            <div>
              <p className="text-white mb-2">Weight Loss Clinics:</p>
              <p className="text-gray-400">Target patients already educated on GLP-1 medications. Skip the awareness phase and close faster with consultation offers.</p>
            </div>
            <div>
              <p className="text-white mb-2">Luxury Brands:</p>
              <p className="text-gray-400">Reach consumers researching high-end watches or jewelry while they're in buying mode. Target with exclusive offers and VIP experiences.</p>
            </div>
          </div>
        </MachineSection>

        {/* Integrations */}
        <MachineSection title="Integrations">
          <p className="text-gray-700 mb-4">
            One-click activation to 200+ platforms:
          </p>
          <MachineList items={[
            "Advertising: Facebook Ads, Google Ads, LinkedIn Ads, TikTok Ads, Snapchat Ads, Twitter Ads",
            "CRM: Salesforce, HubSpot, Marketo, Pardot, Pipedrive, Zoho CRM",
            "Email: Mailchimp, SendGrid, ActiveCampaign, Klaviyo, Braze, Customer.io"
          ]} />
        </MachineSection>

        {/* Pricing */}
        <MachineSection title="Pricing">
          <p className="text-gray-700 mb-4">
            Contact sales for pricing based on vertical, intent level, and activation volume.
          </p>
          <MachineList items={[
            {
              label: "See Pricing",
              href: "https://meetcursive.com/pricing",
              description: "View pricing tiers"
            },
            {
              label: "Explore Intent Audiences",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Schedule a demo"
            }
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Getting Started">
          <MachineList items={[
            {
              label: "Schedule Demo",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "See how intent audiences work"
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
