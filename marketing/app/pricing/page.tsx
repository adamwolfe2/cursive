"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { Check, ArrowRight, Sparkles, HelpCircle } from "lucide-react"
import { useState } from "react"

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
              Transparent Pricing
              <span className="block font-[var(--font-great-vibes)] text-6xl lg:text-7xl text-primary mt-2">
                No Surprises
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Every plan includes dedicated support, custom targeting, and verified data.
              Scale up or down anytime.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Cursive Data */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-xl"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Cursive Data</h3>
                <p className="text-gray-600">Perfect for teams with existing outbound processes</p>
              </div>

              <div className="mb-8">
                <div className="text-4xl font-bold text-primary mb-2">Starting at $1,000<span className="text-lg text-gray-600">/mo</span></div>
                <p className="text-sm text-gray-500">500-2,000 leads per month</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Verified & enriched contacts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom ICP targeting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Monthly refresh</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">CSV export</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated manager</span>
                </li>
              </ul>

              <Button className="w-full" href="https://buy.stripe.com/your-data-link" target="_blank">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">No setup fee • Cancel anytime</p>
            </motion.div>

            {/* Cursive Outbound - Most Popular */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 border-2 border-primary shadow-2xl relative transform lg:scale-105"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-white text-primary px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              </div>

              <div className="mb-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Cursive Outbound</h3>
                <p className="text-blue-100">Done-for-you email campaigns</p>
              </div>

              <div className="mb-8 text-white">
                <div className="text-4xl font-bold mb-2">$3,000<span className="text-lg text-blue-100">/mo</span></div>
                <p className="text-sm text-blue-100">$2,500 one-time setup</p>
              </div>

              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>AI-powered personalization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Email infrastructure setup</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>500 leads included</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>A/B testing & optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Weekly strategy calls</span>
                </li>
              </ul>

              <Button className="w-full bg-white text-primary hover:bg-gray-100" href="https://buy.stripe.com/your-outbound-link" target="_blank">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-center text-blue-100 mt-4">2-week setup • Cancel anytime</p>
            </motion.div>

            {/* Cursive Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-xl"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Cursive Pipeline</h3>
                <p className="text-gray-600">Full-stack AI SDR solution</p>
              </div>

              <div className="mb-8">
                <div className="text-4xl font-bold text-primary mb-2">$5,000<span className="text-lg text-gray-600">/mo</span></div>
                <p className="text-sm text-gray-500">$5,000 one-time setup</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Everything in Outbound</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">AI SDR agents</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Multi-channel campaigns</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Unlimited enrichment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>

              <Button className="w-full" href="https://buy.stripe.com/your-pipeline-link" target="_blank">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">2-3 week onboarding • Cancel anytime</p>
            </motion.div>
          </div>

          {/* Add-Ons Row */}
          <div className="mt-16 max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Add-Ons & Power-Ups</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-center border border-gray-200">
                <div className="text-2xl font-bold text-primary mb-2">$750/mo</div>
                <div className="text-sm font-medium mb-2">Website Visitor Tracking</div>
                <div className="text-xs text-gray-600">+ $0.50 per identified visitor</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-center border border-gray-200">
                <div className="text-2xl font-bold text-primary mb-2">$1,500/mo</div>
                <div className="text-sm font-medium mb-2">Visitor Retargeting</div>
                <div className="text-xs text-gray-600">Requires Visitor Tracking</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-center border border-gray-200">
                <div className="text-2xl font-bold text-primary mb-2">$2,000/mo</div>
                <div className="text-sm font-medium mb-2">White Label Platform</div>
                <div className="text-xs text-gray-600">Includes 10 user seats</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Frequently Asked
                <span className="block font-[var(--font-great-vibes)] text-5xl lg:text-6xl text-primary mt-2">
                  Questions
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-lg">{faq.question}</span>
                    </div>
                    <div className="text-gray-400 ml-4">
                      {openFaq === index ? "−" : "+"}
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5 pl-16">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Ready to 3x Your Pipeline?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Book a call. We'll audit your current lead gen and show you exactly how Cursive can help.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
            >
              Book Your Free Audit
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}

// FAQ Data
const faqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes. All plans are month-to-month. Cancel anytime with 30 days notice. No hidden fees or penalties.",
  },
  {
    question: "What if I don't know which plan to choose?",
    answer: "Book a 15-minute call. We'll ask about your goals, current process, and team size—then recommend the right fit. No pressure, just honest advice.",
  },
  {
    question: "Do you offer custom plans?",
    answer: "Absolutely. For enterprise needs, custom integrations, or volume discounts, contact us directly. We'll build a plan that fits your specific requirements.",
  },
  {
    question: "How fast can we get started?",
    answer: "Cursive Data: Instant access. First list within 5-7 days. Cursive Outbound: 1-2 weeks for full setup (domains, copy, infrastructure). Cursive Pipeline: 2-3 weeks for onboarding and AI training.",
  },
  {
    question: "What kind of companies use Cursive?",
    answer: "B2B SaaS, agencies, consultancies, and service businesses doing $500k-$50M ARR. If you sell to businesses, we can help.",
  },
  {
    question: "Is there a contract?",
    answer: "No long-term contracts. Month-to-month for all plans. We earn your business every month.",
  },
  {
    question: "What's included in the setup fee?",
    answer: "For Outbound: email domain setup, inbox configuration, deliverability optimization, campaign strategy, and AI training. For Pipeline: everything in Outbound plus API integration, AI SDR configuration, and custom workflow design.",
  },
  {
    question: "How do you ensure data quality?",
    answer: "Every contact is verified through multiple data sources and real-time validation. We guarantee 95%+ email deliverability and provide a replacement guarantee for any bounced emails.",
  },
  {
    question: "Can I bring my own lead lists?",
    answer: "Yes! With Cursive Outbound and Pipeline, you can use your existing lists or combine them with ours. We'll enrich and verify them before sending.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Setup fees are non-refundable (we invest significant time in onboarding). Monthly fees are prorated if you cancel mid-month. We stand behind our work—if you're not satisfied, we'll work with you to make it right.",
  },
]
