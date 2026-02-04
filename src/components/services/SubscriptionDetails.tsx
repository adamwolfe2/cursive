'use client'

import { useState } from 'react'
import { CreditCard, Calendar, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface SubscriptionDetailsProps {
  subscription: any
  tier: any
  workspaceId: string
}

export function SubscriptionDetails({ subscription, tier, workspaceId }: SubscriptionDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleManageBilling = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/services/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const statusColors = {
    pending_payment: 'bg-amber-100 text-amber-700 border-amber-200',
    onboarding: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    paused: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    expired: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  }

  const statusColor = statusColors[subscription.status as keyof typeof statusColors] || statusColors.active

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            {tier?.name || 'Your Subscription'}
          </h2>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
            {subscription.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-zinc-900">
            ${subscription.monthly_price?.toLocaleString()}<span className="text-lg text-zinc-500">/mo</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-900">Current Period</p>
            <p className="text-sm text-zinc-600">
              {subscription.current_period_start && subscription.current_period_end
                ? `${formatDate(subscription.current_period_start)} - ${formatDate(subscription.current_period_end)}`
                : 'Not available'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-900">Next Billing Date</p>
            <p className="text-sm text-zinc-600">
              {subscription.current_period_end
                ? formatDate(subscription.current_period_end)
                : 'Not available'}
            </p>
            {subscription.cancel_at_period_end && (
              <p className="text-xs text-amber-600 mt-1">
                Subscription will cancel on this date
              </p>
            )}
          </div>
        </div>
      </div>

      {!subscription.onboarding_completed && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Complete your onboarding</p>
            <p className="text-sm text-amber-700 mt-1">
              We need your targeting criteria to deliver quality leads. This only takes 10 minutes.
            </p>
            <a
              href="/services/onboarding"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-amber-900 hover:text-amber-800"
            >
              Complete Onboarding
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Manage Billing
            </>
          )}
        </button>

        <a
          href={`https://dashboard.stripe.com/customers/${subscription.stripe_customer_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          View in Stripe
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
