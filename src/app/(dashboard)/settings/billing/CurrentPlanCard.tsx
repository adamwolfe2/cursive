'use client'

import Image from 'next/image'
import { UpgradeButton } from '@/components/billing/upgrade-button'
import { Card, CardContent } from '@/components/ui/card'

// Integration logos for the Pro plan card
const INTEGRATION_LOGOS = {
  slack: { src: '/Slack_icon_2019.svg.png', alt: 'Slack' },
  zapier: { src: '/zapier-logo-png-transparent.png', alt: 'Zapier' },
  salesforce: { src: '/Salesforce.com_logo.svg.png', alt: 'Salesforce' },
  hubspot: { src: '/free-hubspot-logo-icon-svg-download-png-2944939.webp', alt: 'HubSpot' },
  pipedrive: { src: '/Pipedrive_Monogram_Green background.png', alt: 'Pipedrive' },
  googleSheets: { src: '/Google_Sheets_Logo_512px.png', alt: 'Google Sheets' },
}

interface CurrentPlanCardProps {
  user: {
    plan?: string
    subscription_status?: string
    subscription_period_end?: string
    cancel_at_period_end?: boolean
  } | undefined
  isPro: boolean
  hasActiveSubscription: boolean
  isCancelled: boolean
  loading: boolean
  onManageBilling: () => void
}

export function CurrentPlanCard({
  user,
  isPro,
  hasActiveSubscription,
  isCancelled,
  loading,
  onManageBilling,
}: CurrentPlanCardProps) {
  return (
    <>
      {/* Value prop strip for free users */}
      {!isPro && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 via-primary/5 to-blue-50 border border-primary/20 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                Unlock the full power of Cursive.
              </h2>
              <p className="text-sm text-gray-600 max-w-xl">
                You&apos;re getting free leads every day. Upgrading adds phone numbers, emails, LinkedIn profiles, and 100 leads/day — so your team can close, not just browse.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  100 leads/day (vs 10 free)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  1,000 enrichments/day
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Website visitor ID (unlimited)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  CSV export + integrations
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <UpgradeButton billingPeriod="monthly" variant="primary" />
              <p className="text-xs text-center text-gray-400 mt-1">Cancel anytime · 30-day guarantee</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  isPro
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isPro ? 'Pro' : 'Free'}
              </span>
              {user?.subscription_status && user.subscription_status !== 'active' && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.subscription_status === 'trialing'
                      ? 'bg-primary/10 text-primary'
                      : user.subscription_status === 'past_due'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {user.subscription_status}
                </span>
              )}
            </div>

            <div className="mb-4" />

            {isPro && user?.subscription_period_end && (
              <p className="text-sm text-muted-foreground mb-4">
                {isCancelled ? (
                  <>
                    <span className="text-red-600 font-medium">Cancelled.</span> Access until{' '}
                    {new Date(user.subscription_period_end).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </>
                ) : (
                  <>
                    Renews on{' '}
                    {new Date(user.subscription_period_end).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </>
                )}
              </p>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Plan Features</h3>
              <ul className="space-y-2">
                {isPro ? (
                  <>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      100 leads delivered daily
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      1,000 enrichment credits/day
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Multi-channel delivery (Email, Slack, Webhooks)
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      CRM + advanced filtering
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Priority support
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      10 leads delivered daily
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      3 enrichment credits/day
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Email delivery only
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg className="mr-2 h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Basic support
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:ml-6 lg:min-w-[200px]">
            {!isPro && (
              <UpgradeButton billingPeriod="monthly" variant="primary" />
            )}

            {isPro && hasActiveSubscription && !isCancelled && (
              <button
                onClick={onManageBilling}
                disabled={loading}
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}

            {isPro && hasActiveSubscription && isCancelled && (
              <button
                onClick={onManageBilling}
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Loading...' : 'Reactivate Subscription'}
              </button>
            )}
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Pro Plan Details for Free users */}
      {!isPro && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-background">
          <CardContent className="pt-6">
            {/* Horizontal layout: Pricing | Features | CTA */}
            <div className="grid md:grid-cols-[1fr_2fr_auto] gap-6 items-center">
              {/* Plan info */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h3 className="text-xl font-bold text-foreground">Pro Plan</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Contact us for pricing details</p>

                {/* Integration Logos */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Integrates with:</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {Object.entries(INTEGRATION_LOGOS).map(([key, { src, alt }]) => (
                      <div
                        key={key}
                        className="h-6 w-6 rounded bg-white/50 p-0.5 flex items-center justify-center"
                        title={alt}
                      >
                        <Image
                          src={src}
                          alt={alt}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Features - Compact horizontal grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">100 leads/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">1,000 enrichments/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">Multi-channel delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">CRM integrations</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">AI lead scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">Priority support</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <UpgradeButton billingPeriod="monthly" variant="primary" />
                <p className="text-xs text-muted-foreground">Cancel anytime</p>
              </div>
            </div>

            {/* Guarantees row */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure payment via Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>Trusted by 500+ sales teams</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
