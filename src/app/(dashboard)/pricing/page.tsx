'use client'

import { useState } from 'react'
import { UpgradeButton } from '@/components/billing/upgrade-button'
import { CREDIT_PACKAGES } from '@/lib/constants/credit-packages'
import { getCreditLink } from '@/lib/stripe/payment-links'

const FREE_FEATURES = [
  '3 credits per day',
  '1 active query',
  'Email delivery only',
  'Basic lead filters',
  'Community support',
]

const PRO_FEATURES = [
  '1,000 credits per day',
  '5 active queries',
  'Multi-channel delivery (Email, Slack, Webhooks)',
  'CRM integrations (Salesforce, HubSpot, Pipedrive)',
  'Advanced filtering & AI lead scoring',
  'Campaign builder with AI copywriting',
  'Priority support',
  '30-day money-back guarantee',
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          Simple, transparent pricing
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Start free and upgrade when you are ready. No hidden fees, cancel anytime.
        </p>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingPeriod === 'yearly'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Yearly
          <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs font-semibold">
            Save 20%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-16">
        {/* Free Tier */}
        <div className="flex flex-col border border-border rounded-xl p-6 bg-background">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Free</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get started with basic lead discovery
            </p>
          </div>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl sm:text-4xl font-bold text-foreground">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <svg
                  className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"
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

          <div className="w-full rounded-lg border border-border px-6 py-3 text-center text-sm font-medium text-muted-foreground">
            Current Plan
          </div>
        </div>

        {/* Pro Tier */}
        <div className="relative flex flex-col border-2 border-primary/40 rounded-xl p-6 bg-gradient-to-b from-primary/5 to-background shadow-md">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Recommended
          </span>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Pro</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock the full power of Cursive
            </p>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl sm:text-4xl font-bold text-foreground">
              ${billingPeriod === 'monthly' ? '50' : '40'}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground line-through">
              ${billingPeriod === 'monthly' ? '99' : '50'}/mo
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
              {billingPeriod === 'monthly' ? 'Save 50%' : 'Save 20% vs monthly'}
            </span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {PRO_FEATURES.map((feature) => (
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
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <UpgradeButton billingPeriod={billingPeriod} plan="pro" variant="primary" />
          <p className="text-xs text-muted-foreground text-center mt-2">Cancel anytime</p>
        </div>
      </div>

      {/* Credit Packages Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Credit Packages
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Purchase additional credits for lead discovery and marketplace purchases. Credits never expire.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {CREDIT_PACKAGES.map((pkg) => {
            // Map package IDs to payment link keys
            const linkMap: Record<string, 'starter' | 'professional' | 'enterprise'> = {
              starter: 'starter',
              growth: 'professional',
              scale: 'enterprise',
              enterprise: 'enterprise',
            }
            const linkKey = linkMap[pkg.id]

            return (
              <a
                key={pkg.id}
                href={linkKey ? getCreditLink(linkKey) : '#'}
                className={`group relative border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all text-left ${
                  pkg.popular ? 'border-primary/30 shadow-md' : 'border-border'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-3 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Popular
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-foreground">
                    ${pkg.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${pkg.pricePerCredit}/credit
                  {pkg.savings > 0 && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                      Save {pkg.savings}%
                    </span>
                  )}
                </p>

                <div className="mt-4 w-full text-center py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Buy Now
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* Guarantees */}
      <div className="border-t border-border pt-8">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secure payment via Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span>Trusted by 500+ sales teams</span>
          </div>
        </div>
      </div>

      {/* Need More Section */}
      <div className="mt-12 rounded-xl border border-border bg-muted/30 p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Need done-for-you services?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
          From custom lead lists to full pipeline management, our expert team handles it all.
        </p>
        <a
          href="/services"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors shadow-sm"
        >
          Explore Services
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
