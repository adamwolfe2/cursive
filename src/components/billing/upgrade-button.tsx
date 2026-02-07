'use client'

import { useState } from 'react'
import { getSubscriptionLink } from '@/lib/stripe/payment-links'

interface UpgradeButtonProps {
  billingPeriod: 'monthly' | 'yearly'
  plan?: 'starter' | 'pro' | 'enterprise'
  className?: string
  variant?: 'primary' | 'secondary'
}

export function UpgradeButton({
  billingPeriod,
  plan = 'pro',
  className = '',
  variant = 'primary',
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)

    try {
      // Create checkout session via API
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingPeriod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Fallback to Stripe Payment Link if checkout session fails
        // (e.g., Stripe Price IDs not configured in database)
        const cycle = billingPeriod === 'yearly' ? 'annual' : 'monthly'
        const paymentUrl = getSubscriptionLink(plan, cycle)
        window.location.href = paymentUrl
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      // Final fallback: use payment link directly
      console.error('Upgrade error, using payment link fallback:', error)
      try {
        const cycle = billingPeriod === 'yearly' ? 'annual' : 'monthly'
        const paymentUrl = getSubscriptionLink(plan, cycle)
        window.location.href = paymentUrl
      } catch {
        alert('Failed to start checkout. Please try again or contact support.')
        setLoading(false)
      }
    }
  }

  const baseClasses =
    'w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'

  const variantClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80'
      : 'bg-white text-primary border-2 border-primary hover:bg-primary/5'

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        'Upgrade to Pro'
      )}
    </button>
  )
}
