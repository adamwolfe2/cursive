'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { UpgradeButton } from '@/components/billing/upgrade-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { getServiceLink } from '@/lib/stripe/payment-links'
import { CREDIT_PACKAGES } from '@/lib/constants/credit-packages'

// Credit package options for the auto-recharge dropdown (matches CREDIT_PACKAGES)
const AUTO_RECHARGE_PACKAGES = [
  { id: 'starter', label: 'Starter — 100 credits ($99)' },
  { id: 'growth', label: 'Growth — 500 credits ($399)' },
  { id: 'scale', label: 'Scale — 1,000 credits ($699)' },
  { id: 'enterprise', label: 'Enterprise — 5,000 credits ($2,999)' },
]

// Integration logos for the Pro plan card
const INTEGRATION_LOGOS = {
  slack: { src: '/Slack_icon_2019.svg.png', alt: 'Slack' },
  zapier: { src: '/zapier-logo-png-transparent.png', alt: 'Zapier' },
  salesforce: { src: '/Salesforce.com_logo.svg.png', alt: 'Salesforce' },
  hubspot: { src: '/free-hubspot-logo-icon-svg-download-png-2944939.webp', alt: 'HubSpot' },
  pipedrive: { src: '/Pipedrive_Monogram_Green background.png', alt: 'Pipedrive' },
  googleSheets: { src: '/Google_Sheets_Logo_512px.png', alt: 'Google Sheets' },
}

interface EnrichmentEntry {
  id: string
  lead_id: string
  status: 'success' | 'failed' | 'no_data'
  credits_used: number
  fields_added: string[]
  created_at: string
}

interface AutoRechargeSettings {
  enabled: boolean
  threshold: number
  recharge_amount: string
}

export default function BillingClient() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Auto-recharge local state (synced from API)
  const [arEnabled, setArEnabled] = useState(false)
  const [arThreshold, setArThreshold] = useState(10)
  const [arPackage, setArPackage] = useState('starter')

  // Low Balance Alert local state (synced from API)
  const [alertThreshold, setAlertThreshold] = useState(10)
  const [alertSaving, setAlertSaving] = useState(false)

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

  // Fetch enrichment history
  const { data: enrichmentData } = useQuery<{
    enrichments: EnrichmentEntry[]
    stats: { total: number; successful: number; today: number }
  }>({
    queryKey: ['enrichment-history'],
    queryFn: async () => {
      const response = await fetch('/api/leads/enrichment-history')
      if (!response.ok) return { enrichments: [], stats: { total: 0, successful: 0, today: 0 } }
      return response.json()
    },
  })

  // Fetch credit alert threshold
  const { data: alertData } = useQuery<{ threshold: number }>({
    queryKey: ['credit-alert-threshold'],
    queryFn: async () => {
      const response = await fetch('/api/billing/credit-alert-threshold')
      if (!response.ok) return { threshold: 10 }
      return response.json()
    },
  })

  // Sync fetched alert threshold into local state
  useEffect(() => {
    if (alertData?.threshold !== undefined) {
      setAlertThreshold(alertData.threshold)
    }
  }, [alertData])

  const handleSaveAlertThreshold = async () => {
    setAlertSaving(true)
    try {
      const response = await fetch('/api/billing/credit-alert-threshold', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: alertThreshold }),
      })
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to save alert threshold')
      } else {
        queryClient.invalidateQueries({ queryKey: ['credit-alert-threshold'] })
        toast.success('Low balance alert threshold saved')
      }
    } catch {
      toast.error('Failed to save alert threshold')
    } finally {
      setAlertSaving(false)
    }
  }

  // Fetch auto-recharge settings
  const { data: autoRechargeData } = useQuery<{ data: AutoRechargeSettings }>({
    queryKey: ['auto-recharge-settings'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/credits/auto-recharge')
      if (!response.ok) return { data: { enabled: false, threshold: 10, recharge_amount: 'starter' } }
      return response.json()
    },
  })

  // Sync fetched auto-recharge settings into local state
  useEffect(() => {
    if (autoRechargeData?.data) {
      setArEnabled(autoRechargeData.data.enabled)
      setArThreshold(autoRechargeData.data.threshold)
      setArPackage(autoRechargeData.data.recharge_amount)
    }
  }, [autoRechargeData])

  // Save auto-recharge settings mutation
  const saveAutoRechargeMutation = useMutation({
    mutationFn: async (settings: AutoRechargeSettings) => {
      const response = await fetch('/api/marketplace/credits/auto-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save auto-recharge settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-recharge-settings'] })
      toast.success('Auto-recharge settings saved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save auto-recharge settings')
    },
  })

  const handleSaveAutoRecharge = () => {
    saveAutoRechargeMutation.mutate({
      enabled: arEnabled,
      threshold: arThreshold,
      recharge_amount: arPackage,
    })
  }

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

  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null)
  const [purchaseCooldown, setPurchaseCooldown] = useState(false)

  const handlePurchaseCredits = async (packageId: string, credits: number, price: number) => {
    // Prevent double-click: ignore if already purchasing or in cooldown
    if (purchasingPackage || purchaseCooldown) return

    setPurchasingPackage(packageId)
    setPurchaseCooldown(true)

    // Generate a client-side request ID for idempotency
    const requestId = `${packageId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    try {
      const response = await fetch('/api/marketplace/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
        },
        body: JSON.stringify({ packageId, credits, amount: price }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start purchase')
    } finally {
      setPurchasingPackage(null)
      // Keep button disabled for 5 seconds after click to prevent rapid re-clicks
      setTimeout(() => setPurchaseCooldown(false), 5000)
    }
  }

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

      {/* Value prop strip for free users */}
      {!isPro && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 via-primary/5 to-blue-50 border border-primary/20 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                One enriched lead can close a $10k deal.
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
          <div className="flex items-center justify-between">
            <CardTitle>Current Usage</CardTitle>
            <Link
              href="/settings/billing/usage"
              className="text-sm font-medium text-primary hover:underline"
            >
              View Usage History →
            </Link>
          </div>
        </CardHeader>
        <CardContent>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Enrichment Credits</span>
              <span className="text-sm text-muted-foreground">
                {user?.credits_remaining || 0} / {user?.daily_credit_limit || (isPro ? 1000 : 3)} remaining
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  (user?.credits_remaining || 0) === 0
                    ? 'bg-red-500'
                    : (user?.credits_remaining || 0) / (user?.daily_credit_limit || (isPro ? 1000 : 3)) <= 0.2
                      ? 'bg-amber-500'
                      : 'bg-primary'
                }`}
                style={{
                  width: `${
                    Math.min(100, Math.max(0, ((user?.credits_remaining || 0) / (user?.daily_credit_limit || (isPro ? 1000 : 3))) * 100))
                  }%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Each enrichment reveals phone, email & LinkedIn. Resets daily at midnight CT (Central Time).</p>

            {/* Credit system explanation */}
            <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">How credits work</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>Each lead enrichment costs 1 credit</li>
                    <li>Free plan: 3 credits/day &nbsp;|&nbsp; Pro plan: 1,000 credits/day</li>
                    <li>Credits reset daily at 8am CT</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Credit usage alerts */}
            {user && (user.credits_remaining || 0) === 0 && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">No credits remaining</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Your daily enrichment credits are used up. They reset at midnight CT.
                      {!isPro && ' Upgrade to Pro for 1,000 credits/day.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {user && (user.credits_remaining || 0) > 0 &&
              (user.credits_remaining || 0) / (user.daily_credit_limit || (isPro ? 1000 : 3)) <= 0.2 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Running low on credits</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      You have {user.credits_remaining} credit{user.credits_remaining === 1 ? '' : 's'} left today.
                      {!isPro && ' Upgrade to Pro for 1,000 credits/day, or buy a credit pack below.'}
                      {isPro && ' Buy a credit pack below for extra enrichments.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
        </CardContent>
      </Card>

      {/* Enrichment Activity */}
      {enrichmentData && enrichmentData.stats.total > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrichment Activity</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{enrichmentData.stats.today} today</span>
                <span className="text-border">|</span>
                <span>{enrichmentData.stats.total} total</span>
                <span className="text-border">|</span>
                <span className="text-green-600">
                  {enrichmentData.stats.total > 0
                    ? Math.round((enrichmentData.stats.successful / enrichmentData.stats.total) * 100)
                    : 0}% success
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {enrichmentData.enrichments.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${
                      entry.status === 'success' ? 'bg-green-500' :
                      entry.status === 'no_data' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <span className="text-muted-foreground font-mono text-xs truncate max-w-[120px]">
                      {entry.lead_id.slice(0, 8)}...
                    </span>
                    {entry.status === 'success' && entry.fields_added.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        +{entry.fields_added.length} field{entry.fields_added.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {entry.status === 'no_data' && (
                      <span className="text-xs text-amber-600">No data found</span>
                    )}
                    {entry.status === 'failed' && (
                      <span className="text-xs text-red-600">Failed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.credits_used} credit</span>
                    <span>
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Buy Credits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buy Credits</CardTitle>
            <Badge variant="outline" className="text-xs">One-time purchase</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Each credit enriches one lead with phone, email, LinkedIn, and company intel.{' '}
                <span className="text-foreground font-medium">Credits never expire.</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                One enriched lead with a direct phone number can be worth 10-100x the cost.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchaseCredits(pkg.id, pkg.credits, pkg.price)}
                disabled={purchasingPackage === pkg.id || purchaseCooldown}
                className={`group border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-left relative disabled:opacity-60 disabled:cursor-wait ${
                  pkg.popular ? 'border-primary/30' : 'border-border'
                }`}
              >
                {pkg.popular && (
                  <Badge variant="default" className="absolute -top-2.5 right-3 text-[10px]">Popular</Badge>
                )}
                <div className="mb-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-lg font-bold text-foreground">${pkg.price.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${pkg.pricePerCredit}/credit
                  {pkg.savings > 0 && ` · Save ${pkg.savings}%`}
                </p>
                <div className="mt-3 w-full text-center py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {purchasingPackage === pkg.id ? 'Redirecting...' : 'Buy Now'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Recharge Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Auto-Recharge</CardTitle>
            <Badge variant="outline" className="text-xs">Never run out</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Automatically top up your credits when your balance falls below a threshold so enrichments never get interrupted.
          </p>

          {/* Enable / disable toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Enable auto-recharge</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically purchase credits when your balance drops below the threshold
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={arEnabled}
              onClick={() => setArEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                arEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                  arEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Threshold and package inputs — only shown when enabled */}
          {arEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Threshold input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="ar-threshold"
                  className="text-sm font-medium text-foreground"
                >
                  Recharge when balance falls below
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="ar-threshold"
                    type="number"
                    min={1}
                    max={500}
                    value={arThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val >= 1 && val <= 500) {
                        setArThreshold(val)
                      }
                    }}
                    className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
                <p className="text-xs text-muted-foreground">Between 1 and 500</p>
              </div>

              {/* Package selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="ar-package"
                  className="text-sm font-medium text-foreground"
                >
                  Recharge amount
                </label>
                <select
                  id="ar-package"
                  value={arPackage}
                  onChange={(e) => setArPackage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {AUTO_RECHARGE_PACKAGES.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Payment method notice */}
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <svg
              className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <p className="text-xs text-muted-foreground">
              Requires a saved payment method. Auto-recharge will charge your card on file. If the charge fails, auto-recharge is automatically disabled.
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAutoRecharge}
              disabled={saveAutoRechargeMutation.isPending}
              className="min-w-[100px]"
            >
              {saveAutoRechargeMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Balance Alert */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Low Balance Alert</CardTitle>
            <Badge variant="outline" className="text-xs">Notification</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get notified when your marketplace credit balance drops below a set threshold.
          </p>
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="alert-threshold"
                className="text-sm font-medium text-foreground"
              >
                Alert me when balance drops below
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="alert-threshold"
                  type="number"
                  min={1}
                  max={1000}
                  value={alertThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val >= 1 && val <= 1000) {
                      setAlertThreshold(val)
                    }
                  }}
                  className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <p className="text-xs text-muted-foreground">Between 1 and 1,000</p>
            </div>
            <Button
              onClick={handleSaveAlertThreshold}
              disabled={alertSaving}
              className="mb-0"
            >
              {alertSaving ? 'Saving...' : 'Save'}
            </Button>
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
