'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { UpgradeButton } from '@/components/billing/upgrade-button'

// Integration logos for the Pro plan card
const INTEGRATION_LOGOS = {
  slack: { src: '/Slack_icon_2019.svg.png', alt: 'Slack' },
  zapier: { src: '/zapier-logo-png-transparent.png', alt: 'Zapier' },
  salesforce: { src: '/Salesforce.com_logo.svg.png', alt: 'Salesforce' },
  hubspot: { src: '/free-hubspot-logo-icon-svg-download-png-2944939.webp', alt: 'HubSpot' },
  pipedrive: { src: '/Pipedrive_Monogram_Green background.png', alt: 'Pipedrive' },
  googleSheets: { src: '/Google_Sheets_Logo_512px.png', alt: 'Google Sheets' },
}

function SettingsNav({ currentPath }: { currentPath: string }) {
  const tabs = [
    { name: 'Profile', href: '/settings' },
    { name: 'Billing', href: '/settings/billing' },
    { name: 'Security', href: '/settings/security' },
    { name: 'Notifications', href: '/settings/notifications' },
  ]

  return (
    <div className="border-b border-zinc-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
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
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-64 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  const isPro = user?.plan === 'pro'
  const hasActiveSubscription =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'
  const isCancelled = user?.cancel_at_period_end

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Billing & Subscription</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Navigation Tabs */}
      <SettingsNav currentPath="/settings/billing" />

      {/* Current Plan Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Current Plan</h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  isPro
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-zinc-100 text-zinc-800'
                }`}
              >
                {isPro ? 'Pro' : 'Free'}
              </span>
              {user?.subscription_status && user.subscription_status !== 'active' && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.subscription_status === 'trialing'
                      ? 'bg-blue-100 text-blue-800'
                      : user.subscription_status === 'past_due'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {user.subscription_status}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-zinc-900">
                ${isPro ? '50' : '0'}
              </span>
              <span className="text-zinc-500">/month</span>
            </div>

            {isPro && user?.subscription_period_end && (
              <p className="text-sm text-zinc-600 mb-4">
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
              <h3 className="text-sm font-medium text-zinc-900">Plan Features</h3>
              <ul className="space-y-2">
                {isPro ? (
                  <>
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                    <li className="flex items-center text-sm text-zinc-600">
                      <svg
                        className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"
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
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            )}

            {isPro && hasActiveSubscription && isCancelled && (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Loading...' : 'Reactivate Subscription'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Current Usage</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">Daily Credits</span>
              <span className="text-sm text-zinc-600">
                {user?.credits_remaining || 0} / {isPro ? '1,000' : '3'} remaining
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{
                  width: `${
                    ((user?.credits_remaining || 0) / (isPro ? 1000 : 3)) * 100
                  }%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">Resets daily at midnight UTC</p>
          </div>

          <div className="pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">Active Queries</span>
              <span className="text-sm text-zinc-600">0 / {isPro ? '5' : '1'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Plan Details for Free users */}
      {!isPro && (
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm relative overflow-hidden">
          {/* Popular badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side - Plan info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-zinc-900">Pro Plan</h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  Recommended
                </span>
              </div>
              <p className="text-zinc-600 mb-6">
                Everything you need to scale your lead generation and close more deals.
              </p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-zinc-900">$50</span>
                <span className="text-zinc-500">/month</span>
                <span className="ml-2 text-sm text-zinc-400 line-through">$99/month</span>
                <span className="text-sm font-medium text-green-600">Save 50%</span>
              </div>

              <UpgradeButton billingPeriod="monthly" variant="primary" />

              <p className="mt-3 text-xs text-zinc-500 text-center">
                Cancel anytime. No long-term commitment.
              </p>
            </div>

            {/* Right side - Features */}
            <div className="flex-1 lg:border-l lg:border-zinc-200 lg:pl-8">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
                Everything in Free, plus:
              </h3>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">1,000 credits per day</span>
                    <p className="text-sm text-zinc-500">333x more than Free plan</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">5 active queries</span>
                    <p className="text-sm text-zinc-500">Monitor multiple intent signals</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">Multi-channel delivery</span>
                    <p className="text-sm text-zinc-500">Email, Slack, Webhooks, Zapier</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-white shadow-sm border border-zinc-200">
                        <Image src={INTEGRATION_LOGOS.slack.src} alt={INTEGRATION_LOGOS.slack.alt} fill className="object-contain p-0.5" />
                      </div>
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-white shadow-sm border border-zinc-200">
                        <Image src={INTEGRATION_LOGOS.zapier.src} alt={INTEGRATION_LOGOS.zapier.alt} fill className="object-contain p-0.5" />
                      </div>
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-white shadow-sm border border-zinc-200">
                        <Image src={INTEGRATION_LOGOS.googleSheets.src} alt={INTEGRATION_LOGOS.googleSheets.alt} fill className="object-contain p-0.5" />
                      </div>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">CRM integrations</span>
                    <p className="text-sm text-zinc-500">Salesforce, HubSpot, Pipedrive</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-white shadow-sm border border-zinc-200">
                        <Image src={INTEGRATION_LOGOS.salesforce.src} alt={INTEGRATION_LOGOS.salesforce.alt} fill className="object-contain p-0.5" />
                      </div>
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-white shadow-sm border border-zinc-200">
                        <Image src={INTEGRATION_LOGOS.hubspot.src} alt={INTEGRATION_LOGOS.hubspot.alt} fill className="object-contain p-0.5" />
                      </div>
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-white shadow-sm border border-zinc-200">
                        <Image src={INTEGRATION_LOGOS.pipedrive.src} alt={INTEGRATION_LOGOS.pipedrive.alt} fill className="object-contain p-0.5" />
                      </div>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">Advanced filtering</span>
                    <p className="text-sm text-zinc-500">Industry, company size, location</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">AI-powered lead scoring</span>
                    <p className="text-sm text-zinc-500">Prioritize high-intent leads</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">Email sequences</span>
                    <p className="text-sm text-zinc-500">Automated outreach campaigns</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">Priority support</span>
                    <p className="text-sm text-zinc-500">24-hour response time</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-zinc-900">API access</span>
                    <p className="text-sm text-zinc-500">Build custom integrations</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure payment via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>Trusted by 500+ sales teams</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Payment Method</h2>

        {isPro && hasActiveSubscription ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Your payment method and billing details are securely managed by Stripe.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Update payment method →'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            You don&apos;t have an active subscription. Upgrade to Pro to add a payment
            method.
          </p>
        )}
      </div>

      {/* Billing History */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Billing History</h2>

        {isPro && hasActiveSubscription ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              View and download your billing history in the Stripe Customer Portal.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'View billing history →'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No billing history available.</p>
        )}
      </div>

      {/* Cancel Subscription */}
      {isPro && hasActiveSubscription && !isCancelled && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Cancel Subscription</h2>
          <p className="text-sm text-red-700 mb-4">
            Your subscription will remain active until the end of the current billing
            period. You can reactivate at any time before then.
          </p>

          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              Cancel Subscription
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-800 font-medium">
                Are you sure you want to cancel your subscription?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {cancelSubscriptionMutation.isPending
                    ? 'Cancelling...'
                    : 'Yes, Cancel Subscription'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
