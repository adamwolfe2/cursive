'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { UpgradeButton } from '@/components/billing/upgrade-button'

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(false)

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
      console.error('Portal error:', error)
      alert(error.message || 'Failed to open billing portal. Please try again.')
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const isPro = user?.plan === 'pro'
  const hasActiveSubscription =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Current Plan
            </h2>
            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">
                  {isPro ? 'Pro' : 'Free'}
                </span>
                {isPro && (
                  <span className="ml-2 text-gray-500">
                    ${user?.plan === 'pro' ? '50' : '0'}/month
                  </span>
                )}
              </div>

              {isPro && user?.subscription_period_end && (
                <p className="mt-2 text-sm text-gray-600">
                  {user.cancel_at_period_end ? (
                    <>
                      Your subscription will end on{' '}
                      {new Date(user.subscription_period_end).toLocaleDateString()}
                    </>
                  ) : (
                    <>
                      Renews on{' '}
                      {new Date(user.subscription_period_end).toLocaleDateString()}
                    </>
                  )}
                </p>
              )}

              {user?.subscription_status && user.subscription_status !== 'active' && (
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.subscription_status === 'trialing'
                        ? 'bg-blue-100 text-blue-800'
                        : user.subscription_status === 'past_due'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.subscription_status}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Plan Features</h3>
              <ul className="space-y-2">
                {isPro ? (
                  <>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg
                        className="mr-2 h-4 w-4 text-green-500"
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
                      1000 credits per day
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg
                        className="mr-2 h-4 w-4 text-green-500"
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
                    <li className="flex items-center text-sm text-gray-600">
                      <svg
                        className="mr-2 h-4 w-4 text-green-500"
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
                      Multi-channel delivery
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg
                        className="mr-2 h-4 w-4 text-green-500"
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
                    <li className="flex items-center text-sm text-gray-600">
                      <svg
                        className="mr-2 h-4 w-4 text-green-500"
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
                    <li className="flex items-center text-sm text-gray-600">
                      <svg
                        className="mr-2 h-4 w-4 text-green-500"
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
                      Email delivery
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            {!isPro && (
              <UpgradeButton billingPeriod="monthly" variant="primary" />
            )}

            {isPro && hasActiveSubscription && (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Usage
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Daily Credits
              </span>
              <span className="text-sm text-gray-600">
                {user?.credits_remaining || 0} /{' '}
                {isPro ? '1000' : '3'} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    ((user?.credits_remaining || 0) /
                      (isPro ? 1000 : 3)) *
                    100
                  }%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Resets daily at midnight UTC
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Active Queries
              </span>
              <span className="text-sm text-gray-600">
                {/* This would come from a query count */}
                0 / {isPro ? '5' : '1'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for Free users */}
      {!isPro && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
          <p className="text-blue-100 mb-6">
            Get 1000 credits per day, 5 active queries, and multi-channel
            delivery for just $50/month
          </p>
          <UpgradeButton
            billingPeriod="monthly"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          />
        </div>
      )}

      {/* Billing Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Information
        </h2>

        {isPro && hasActiveSubscription ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your payment method and billing details are securely managed by
              Stripe.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Update payment method →'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            You don&apos;t have an active subscription. Upgrade to Pro to add a
            payment method.
          </p>
        )}
      </div>
    </div>
  )
}
