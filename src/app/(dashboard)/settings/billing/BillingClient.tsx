'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { SendLimitsCard } from '@/components/settings/send-limits-card'
import { CurrentPlanCard } from './CurrentPlanCard'
import { UsageCard } from './UsageCard'
import { EnrichmentActivityCard } from './EnrichmentActivityCard'
import { BuyCreditsCard } from './BuyCreditsCard'
import { AutoRechargeCard } from './AutoRechargeCard'
import { getErrorMessage } from '@/lib/utils/error-helpers'
import { ServiceTiersCard } from './ServiceTiersCard'

interface EnrichmentEntry {
  id: string
  lead_id: string
  status: 'success' | 'failed' | 'no_data'
  credits_used: number
  fields_added: string[]
  created_at: string
}

export default function BillingClient() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Low Balance Alert local state (synced from API)
  const [alertThreshold, setAlertThreshold] = useState(10)
  const [alertSaving, setAlertSaving] = useState(false)

  // Fetch current user data
  const { data: userData, isLoading, isError, error } = useQuery({
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
      } else {
        setLoading(false)
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to open billing portal')
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

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive font-medium mb-2">Failed to load billing information</p>
        <p className="text-xs text-muted-foreground mb-4">
          {(error as Error)?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium underline text-foreground hover:text-primary"
        >
          Reload page
        </button>
      </div>
    )
  }

  const isPro = user?.plan === 'pro'
  const hasActiveSubscription =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'
  const isCancelled = user?.cancel_at_period_end

  return (
    <div className="space-y-6">

      {/* Current Plan + Free value prop strip */}
      <CurrentPlanCard
        user={user}
        isPro={isPro}
        hasActiveSubscription={hasActiveSubscription}
        isCancelled={isCancelled}
        loading={loading}
        onManageBilling={handleManageBilling}
      />

      {/* Usage Card */}
      <UsageCard user={user} isPro={isPro} />

      {/* Send Limits */}
      <SendLimitsCard />

      {/* Enrichment Activity */}
      {enrichmentData && enrichmentData.stats.total > 0 && (
        <EnrichmentActivityCard
          enrichments={enrichmentData.enrichments}
          stats={enrichmentData.stats}
        />
      )}

      {/* Buy Credits Section */}
      <BuyCreditsCard />

      {/* Auto-Recharge Section */}
      <AutoRechargeCard />

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
      <ServiceTiersCard />

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
