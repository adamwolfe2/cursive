'use client'

/**
 * Pricing Page
 * OpenInfo Platform Marketing Site
 *
 * Pricing plans with feature comparison.
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  FadeIn,
  AnimatedHeading,
  AnimatedCard,
  AnimatedButton,
  AnimatedContainer,
  AnimatedItem,
  NewsletterCTA,
} from '@/components/marketing'

// ============================================
// PRICING DATA
// ============================================

const plans = [
  {
    name: 'Free',
    description: 'Perfect for individuals and small projects',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Up to 5 team members',
      '100 tasks per month',
      'Basic reports',
      'Email support',
      '1 workspace',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For growing teams that need more power',
    price: { monthly: 29, yearly: 24 },
    features: [
      'Up to 25 team members',
      'Unlimited tasks',
      'Advanced reports & analytics',
      'AI-powered insights',
      'Priority support',
      '5 workspaces',
      'Integrations',
      'Custom fields',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: { monthly: 99, yearly: 79 },
    features: [
      'Unlimited team members',
      'Unlimited tasks',
      'Everything in Pro',
      'White-label option',
      'SSO & SAML',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Can I try before I buy?',
    answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    question: 'What happens when I exceed my limits?',
    answer: "We'll notify you when you're approaching your limits. You can upgrade anytime or we can discuss a custom plan.",
  },
  {
    question: 'Can I change plans later?',
    answer: 'Absolutely. You can upgrade, downgrade, or cancel at any time. Changes take effect immediately.',
  },
  {
    question: 'Do you offer discounts for nonprofits?',
    answer: 'Yes! We offer 50% off for registered nonprofits and educational institutions. Contact us to learn more.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Security is our top priority. We use enterprise-grade encryption, regular security audits, and are SOC 2 compliant.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and for Enterprise plans, we can arrange invoicing.',
  },
]

// ============================================
// PRICING PAGE
// ============================================

export default function PricingPage() {
  const [isYearly, setIsYearly] = React.useState(true)

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Pricing
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h1"
            className="text-4xl lg:text-6xl font-bold text-neutral-900 mt-4 mb-6"
          >
            Simple, transparent pricing
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-2xl mx-auto mb-10">
              Choose the plan that's right for your team. All plans include a 14-day free trial.
            </p>
          </FadeIn>

          {/* Billing Toggle */}
          <FadeIn delay={0.3}>
            <div className="inline-flex items-center bg-neutral-100 rounded-full p-1">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition-all',
                  !isYearly
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition-all',
                  isYearly
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600'
                )}
              >
                Yearly
                <span className="ml-2 text-xs text-emerald-600 font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 lg:py-16 -mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <AnimatedItem key={plan.name}>
                <PricingCard
                  plan={plan}
                  isYearly={isYearly}
                  index={index}
                />
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4"
            >
              Compare plans
            </AnimatedHeading>
            <FadeIn delay={0.2}>
              <p className="text-neutral-600">
                See which plan is right for your team
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <FeatureComparison />
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <AnimatedHeading
              tag="h2"
              className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4"
            >
              Frequently asked questions
            </AnimatedHeading>
          </div>

          <AnimatedContainer className="space-y-4">
            {faqs.map((faq, index) => (
              <AnimatedItem key={index}>
                <FAQItem question={faq.question} answer={faq.answer} />
              </AnimatedItem>
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* CTA */}
      <NewsletterCTA />
    </div>
  )
}

// ============================================
// PRICING CARD
// ============================================

interface PricingCardProps {
  plan: typeof plans[0]
  isYearly: boolean
  index: number
}

function PricingCard({ plan, isYearly, index }: PricingCardProps) {
  const price = isYearly ? plan.price.yearly : plan.price.monthly

  return (
    <AnimatedCard
      className={cn(
        'p-6 lg:p-8 h-full flex flex-col relative',
        plan.popular && 'ring-2 ring-neutral-900'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-neutral-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
        <p className="text-sm text-neutral-600">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-neutral-900">
            ${price}
          </span>
          {price > 0 && (
            <span className="text-neutral-500">/month</span>
          )}
        </div>
        {isYearly && price > 0 && (
          <p className="text-sm text-neutral-500 mt-1">
            Billed annually (${price * 12}/year)
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm text-neutral-600">{feature}</span>
          </li>
        ))}
      </ul>

      <AnimatedButton
        variant={plan.popular ? 'primary' : 'outline'}
        size="lg"
        className="w-full"
      >
        {plan.cta}
      </AnimatedButton>
    </AnimatedCard>
  )
}

// ============================================
// FEATURE COMPARISON
// ============================================

const comparisonFeatures = [
  { name: 'Team members', free: '5', pro: '25', enterprise: 'Unlimited' },
  { name: 'Tasks', free: '100/mo', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Workspaces', free: '1', pro: '5', enterprise: 'Unlimited' },
  { name: 'Reports', free: 'Basic', pro: 'Advanced', enterprise: 'Custom' },
  { name: 'AI Insights', free: false, pro: true, enterprise: true },
  { name: 'Integrations', free: false, pro: true, enterprise: true },
  { name: 'SSO/SAML', free: false, pro: false, enterprise: true },
  { name: 'White-label', free: false, pro: false, enterprise: true },
  { name: 'API Access', free: false, pro: true, enterprise: true },
  { name: 'Support', free: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
]

function FeatureComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="py-4 px-4 text-left font-medium text-neutral-500">Feature</th>
            <th className="py-4 px-4 text-center font-medium text-neutral-500">Free</th>
            <th className="py-4 px-4 text-center font-medium text-neutral-900 bg-neutral-100 rounded-t-lg">Pro</th>
            <th className="py-4 px-4 text-center font-medium text-neutral-500">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {comparisonFeatures.map((feature, index) => (
            <tr
              key={feature.name}
              className={cn(
                'border-b border-neutral-100',
                index % 2 === 0 && 'bg-neutral-50/50'
              )}
            >
              <td className="py-4 px-4 text-sm text-neutral-700">{feature.name}</td>
              <td className="py-4 px-4 text-center">
                <FeatureValue value={feature.free} />
              </td>
              <td className="py-4 px-4 text-center bg-neutral-100/50">
                <FeatureValue value={feature.pro} />
              </td>
              <td className="py-4 px-4 text-center">
                <FeatureValue value={feature.enterprise} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <svg className="w-5 h-5 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-neutral-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }

  return <span className="text-sm text-neutral-600">{value}</span>
}

// ============================================
// FAQ ITEM
// ============================================

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <AnimatedCard className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-medium text-neutral-900">{question}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="w-5 h-5 text-neutral-500 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-6 text-neutral-600 leading-relaxed">
          {answer}
        </p>
      </motion.div>
    </AnimatedCard>
  )
}
