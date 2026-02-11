'use client'

import { getServiceLink } from '@/lib/stripe/payment-links'

const SERVICE_TIERS = [
  {
    key: 'data' as const,
    name: 'Cursive Data',
    description: 'Custom lead lists delivered monthly, built around your ICP and market.',
    priceRange: '$1k-3k',
    priceUnit: '/mo',
    setupFee: null,
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    features: [
      'Custom ICP-matched lead lists',
      'Verified contact data (email + phone)',
      'Monthly delivery cadence',
      'Firmographic & technographic filters',
      'Dedicated data analyst',
      'CRM-ready CSV or direct integration',
    ],
  },
  {
    key: 'outbound' as const,
    name: 'Cursive Outbound',
    description: 'Done-for-you email campaigns that book meetings on your calendar.',
    priceRange: '$3-5k',
    priceUnit: '/mo',
    setupFee: '+ $2.5k setup',
    popular: true,
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    features: [
      'Everything in Cursive Data',
      'AI-written email sequences',
      'Multi-channel outreach (email + LinkedIn)',
      'Managed mailbox infrastructure',
      'A/B testing & sequence optimization',
      'Weekly performance reporting',
      'Dedicated campaign manager',
    ],
  },
  {
    key: 'pipeline' as const,
    name: 'Cursive Pipeline',
    description: 'Full pipeline management with AI SDR that qualifies and books meetings.',
    priceRange: '$5-10k',
    priceUnit: '/mo',
    setupFee: '+ $5k setup',
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    features: [
      'Everything in Cursive Outbound',
      'AI SDR agent for lead qualification',
      'Automated meeting booking',
      'CRM pipeline management (GHL)',
      'Intent signal monitoring',
      'Custom reporting dashboard',
      'Dedicated growth strategist',
      'Slack channel for real-time updates',
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          Done-For-You Services
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
          Go beyond software. Our expert team handles everything from lead sourcing to
          pipeline management so you can focus on closing deals.
        </p>
      </div>

      {/* Service Tier Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {SERVICE_TIERS.map((tier) => (
          <div
            key={tier.key}
            className={`relative flex flex-col border rounded-xl p-6 transition-all hover:shadow-lg ${
              tier.popular
                ? 'border-primary/40 bg-gradient-to-b from-primary/5 to-background shadow-md'
                : 'border-border bg-background hover:border-primary/30'
            }`}
          >
            {/* Popular Badge */}
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </span>
            )}

            {/* Icon & Name */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
                {tier.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground">{tier.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{tier.priceRange}</span>
                <span className="text-sm text-muted-foreground">{tier.priceUnit}</span>
              </div>
              {tier.setupFee && (
                <p className="text-sm text-muted-foreground mt-1">{tier.setupFee}</p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <svg
                    className="h-4 w-4 text-primary flex-shrink-0 mt-0.5"
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
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <a
              href={tier.key === 'data' ? getServiceLink(tier.key) : `/services/request?tier=cursive-${tier.key}`}
              className={`block w-full text-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors shadow-sm ${
                tier.popular
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}
            >
              Get Started
            </a>
          </div>
        ))}
      </div>

      {/* Contact Sales Section */}
      <div className="mt-12 rounded-xl border border-border bg-muted/30 p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Need something custom?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
          Get custom pricing and white-glove service with Cursive Venture Studio.
          We will build a growth engine tailored to your business.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/services/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors shadow-sm"
          >
            Contact Sales
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="mailto:hey@meetcursive.com"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            hey@meetcursive.com
          </a>
        </div>
      </div>
    </div>
  )
}
