'use client'

import { motion } from 'framer-motion'
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
          Upgrades & Services
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
          Boost your lead generation with self-serve add-ons or let our team handle everything for you.
        </p>
      </div>

      {/* Self-Serve Upgrades */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Self-Serve Upgrades</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/settings/billing" className="group flex flex-col border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all bg-background">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Pro Plan</h3>
            <p className="text-xs text-muted-foreground mb-3 flex-1">100 leads/day, enrichment credits, priority support</p>
            <span className="text-xs font-medium text-primary group-hover:underline">Upgrade Now</span>
          </a>

          <a href="/settings/pixel" className="group flex flex-col border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all bg-background">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Website Pixel</h3>
            <p className="text-xs text-muted-foreground mb-3 flex-1">Identify anonymous website visitors with a tracking pixel</p>
            <span className="text-xs font-medium text-primary group-hover:underline">Start Free Trial</span>
          </a>

          <a href="/settings/billing#credits" className="group flex flex-col border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all bg-background">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Enrichment Credits</h3>
            <p className="text-xs text-muted-foreground mb-3 flex-1">Buy credits to enrich leads with phone, email, and LinkedIn</p>
            <span className="text-xs font-medium text-primary group-hover:underline">Buy Credits</span>
          </a>

          <a href="/settings/branding" className="group flex flex-col border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all bg-background">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">White Label</h3>
            <p className="text-xs text-muted-foreground mb-3 flex-1">Custom branding, colors, logo, and domain</p>
            <span className="text-xs font-medium text-primary group-hover:underline">Request Access</span>
          </a>
        </div>
      </div>

      {/* Done-For-You Services Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Done-For-You Services</h2>
        <p className="text-sm text-muted-foreground">
          Our expert team handles everything from lead sourcing to pipeline management.
        </p>
      </div>

      {/* Service Tier Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {SERVICE_TIERS.map((tier, index) => (
          <motion.div
            key={tier.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-12 mb-0">
        <h2 className="text-lg font-semibold text-foreground mb-1">What&apos;s included</h2>
        <p className="text-sm text-muted-foreground mb-6">Every tier builds on the one before it.</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-5 py-3.5 font-medium text-foreground w-1/2">Feature</th>
                <th className="text-center px-4 py-3.5 font-medium text-foreground">
                  <div>Data</div>
                  <div className="text-xs font-normal text-muted-foreground">$1k–3k/mo</div>
                </th>
                <th className="text-center px-4 py-3.5 font-medium text-foreground">
                  <div className="flex items-center justify-center gap-1.5">
                    Outbound
                    <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground leading-none">Popular</span>
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">$3–5k/mo</div>
                </th>
                <th className="text-center px-4 py-3.5 font-medium text-foreground">
                  <div>Pipeline</div>
                  <div className="text-xs font-normal text-muted-foreground">$5–10k/mo</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: 'Custom ICP-matched lead lists', data: true, outbound: true, pipeline: true },
                { label: 'Verified contact data (email + phone)', data: true, outbound: true, pipeline: true },
                { label: 'Monthly delivery cadence', data: true, outbound: true, pipeline: true },
                { label: 'Firmographic & technographic filters', data: true, outbound: true, pipeline: true },
                { label: 'Dedicated data analyst', data: true, outbound: true, pipeline: true },
                { label: 'CRM-ready CSV or direct integration', data: true, outbound: true, pipeline: true },
                { label: 'AI-written email sequences', data: false, outbound: true, pipeline: true },
                { label: 'Multi-channel outreach (email + LinkedIn)', data: false, outbound: true, pipeline: true },
                { label: 'Managed mailbox infrastructure', data: false, outbound: true, pipeline: true },
                { label: 'A/B testing & sequence optimization', data: false, outbound: true, pipeline: true },
                { label: 'Weekly performance reporting', data: false, outbound: true, pipeline: true },
                { label: 'Dedicated campaign manager', data: false, outbound: true, pipeline: true },
                { label: 'AI SDR agent for lead qualification', data: false, outbound: false, pipeline: true },
                { label: 'Automated meeting booking', data: false, outbound: false, pipeline: true },
                { label: 'CRM pipeline management (GHL)', data: false, outbound: false, pipeline: true },
                { label: 'Intent signal monitoring', data: false, outbound: false, pipeline: true },
                { label: 'Slack channel for real-time updates', data: false, outbound: false, pipeline: true },
                { label: 'Dedicated growth strategist', data: false, outbound: false, pipeline: true },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-foreground">{row.label}</td>
                  {(['data', 'outbound', 'pipeline'] as const).map((tier) => (
                    <td key={tier} className="text-center px-4 py-3">
                      {row[tier] ? (
                        <svg className="h-4 w-4 text-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-muted-foreground/30 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Sales Section */}
      <div className="mt-10 rounded-xl border border-border bg-muted/30 p-8 text-center">
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
            href="mailto:hello@meetcursive.com"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            hello@meetcursive.com
          </a>
        </div>
      </div>
    </div>
  )
}
