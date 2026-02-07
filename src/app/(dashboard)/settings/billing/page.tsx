'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { UpgradeButton } from '@/components/billing/upgrade-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import {
  getServiceLink,
  getCreditLink,
  PAYMENT_LINKS,
} from '@/lib/stripe/payment-links'

// Integration logos for the Pro plan card
const INTEGRATION_LOGOS = {
  slack: { src: '/Slack_icon_2019.svg.png', alt: 'Slack' },
  zapier: { src: '/zapier-logo-png-transparent.png', alt: 'Zapier' },
  salesforce: { src: '/Salesforce.com_logo.svg.png', alt: 'Salesforce' },
  hubspot: { src: '/free-hubspot-logo-icon-svg-download-png-2944939.webp', alt: 'HubSpot' },
  pipedrive: { src: '/Pipedrive_Monogram_Green background.png', alt: 'Pipedrive' },
  googleSheets: { src: '/Google_Sheets_Logo_512px.png', alt: 'Google Sheets' },
}

export default function BillingSettingsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Fetch current user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Subscription cancelled successfully')
      setShowCancelConfirm(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel subscription')
    },
  })

  const handleManageBilling = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal')
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const isPro = user?.plan === 'pro'
  const hasActiveSubscription =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'
  const isCancelled = user?.cancel_at_period_end

  return (
    <div className="space-y-6">
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

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">
                ${isPro ? '50' : '0'}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>

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
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      1,000 credits per day
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      5 active queries
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      Multi-channel delivery (Email, Slack, Webhooks)
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      Advanced filtering
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      Priority support
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      3 credits per day
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      1 active query
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                      Email delivery only
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <svg
                        className="mr-2 h-4 w-4 text-primary flex-shrink-0"
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
                onClick={handleManageBilling}
                disabled={loading}
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}

            {isPro && hasActiveSubscription && isCancelled && (
              <button
                onClick={handleManageBilling}
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

      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
        </CardHeader>
        <CardContent>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Daily Credits</span>
              <span className="text-sm text-muted-foreground">
                {user?.credits_remaining || 0} / {user?.daily_credit_limit || (isPro ? 1000 : 3)} remaining
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all"
                style={{
                  width: `${
                    Math.min(100, Math.max(0, ((user?.credits_remaining || 0) / (user?.daily_credit_limit || (isPro ? 1000 : 3))) * 100))
                  }%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Resets daily at midnight UTC</p>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Active Queries</span>
              <span className="text-sm text-muted-foreground">0 / {isPro ? '5' : '1'}</span>
            </div>
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
              {/* Pricing */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h3 className="text-xl font-bold text-foreground">Pro Plan</h3>
                  <Badge variant="default">Save 50%</Badge>
                </div>
                <div className="flex items-baseline justify-center md:justify-start gap-1">
                  <span className="text-3xl font-bold text-foreground">$50</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-through">$99/month</p>

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
                  <span className="text-sm text-foreground">1,000 credits/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-foreground">5 active queries</span>
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

      {/* Buy Credits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buy Credits</CardTitle>
            <Badge variant="outline" className="text-xs">One-time purchase</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Purchase additional credits for lead discovery and marketplace purchases. Credits never expire.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Lead Purchase */}
            <button
              onClick={() => window.open(getCreditLink('leadPurchase'), '_blank', 'noopener,noreferrer')}
              className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors text-sm">
                {PAYMENT_LINKS.credits.leadPurchase.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Individual lead credits
              </p>
            </button>

            {/* Starter Credits */}
            <button
              onClick={() => window.open(getCreditLink('starter'), '_blank', 'noopener,noreferrer')}
              className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors text-sm">
                {PAYMENT_LINKS.credits.starter.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Small credit pack to get started
              </p>
            </button>

            {/* Professional Credits */}
            <button
              onClick={() => window.open(getCreditLink('professional'), '_blank', 'noopener,noreferrer')}
              className="group border border-primary/30 rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-left relative"
            >
              <Badge variant="default" className="absolute -top-2.5 right-3 text-[10px]">Popular</Badge>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors text-sm">
                {PAYMENT_LINKS.credits.professional.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Best value for growing teams
              </p>
            </button>

            {/* Enterprise Credits */}
            <button
              onClick={() => window.open(getCreditLink('enterprise'), '_blank', 'noopener,noreferrer')}
              className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors text-sm">
                {PAYMENT_LINKS.credits.enterprise.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Volume credits for large teams
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Service Tiers Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Need More Than Software?</CardTitle>
            <Link
              href="/services"
              className="text-sm font-medium text-primary hover:underline"
            >
              View All Services →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Explore done-for-you services from custom lead lists to full-service growth partnership.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Cursive Data */}
            <a
              href={getServiceLink('data')}
              className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                Cursive Data
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Custom lead lists delivered monthly
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">$1k-3k</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            </a>

            {/* Cursive Outbound */}
            <a
              href={getServiceLink('outbound')}
              className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                Cursive Outbound
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Done-for-you email campaigns
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">$3-5k</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">+ $2.5k setup</p>
            </a>

            {/* Cursive Pipeline */}
            <a
              href={getServiceLink('pipeline')}
              className="group border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                Cursive Pipeline
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Full pipeline with AI SDR
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">$5-10k</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">+ $5k setup</p>
            </a>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Get custom pricing and white-glove service with Cursive Studio
              </p>
              <Link
                href="/services/contact"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors text-sm"
              >
                Contact Sales
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {isPro && hasActiveSubscription ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your payment method and billing details are securely managed by Stripe.
              </p>
              <Button
                variant="link"
                onClick={handleManageBilling}
                disabled={loading}
                className="px-0"
              >
                {loading ? 'Loading...' : 'Update payment method'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have an active subscription. Upgrade to Pro to add a payment
              method.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {isPro && hasActiveSubscription ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                View and download your billing history in the Stripe Customer Portal.
              </p>
              <Button
                variant="link"
                onClick={handleManageBilling}
                disabled={loading}
                className="px-0"
              >
                {loading ? 'Loading...' : 'View billing history'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No billing history available.</p>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      {isPro && hasActiveSubscription && !isCancelled && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your subscription will remain active until the end of the current billing
              period. You can reactivate at any time before then.
            </p>

            {!showCancelConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Cancel Subscription
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-destructive font-medium">
                  Are you sure you want to cancel your subscription?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                  >
                    {cancelSubscriptionMutation.isPending
                      ? 'Cancelling...'
                      : 'Yes, Cancel Subscription'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Keep Subscription
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
