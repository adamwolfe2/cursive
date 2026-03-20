'use client'

import Link from 'next/link'

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
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          Plans & Features
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Start free and upgrade when you are ready. Contact us for custom pricing tailored to your needs.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-16">
        {/* Free Tier */}
        <div className="flex flex-col border border-border rounded-xl p-6 bg-background">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Free</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get started with basic lead discovery
            </p>
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

          <Link
            href="/services/contact"
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/90 px-6 py-3 text-base font-semibold text-white text-center hover:from-primary/90 hover:to-primary/80 transition-colors shadow-sm"
          >
            Contact Us to Upgrade
          </Link>
          <p className="text-xs text-muted-foreground text-center mt-2">Cancel anytime</p>
        </div>
      </div>

      {/* Need More Section */}
      <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
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
