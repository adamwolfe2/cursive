'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getSubscriptionLink } from '@/lib/stripe/payment-links'

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  features: string[]
  sort_order: number
  is_popular?: boolean
}

interface PricingCardsProps {
  plans: SubscriptionPlan[]
  currentPlan?: string
}

export function PricingCards({ plans, currentPlan }: PricingCardsProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const router = useRouter()

  const handleCheckout = async (plan: SubscriptionPlan) => {
    if (plan.name === 'free') {
      // Free plan - redirect to signup
      router.push('/signup')
      return
    }

    if (plan.name === currentPlan) {
      // Already on this plan
      return
    }

    setLoadingPlanId(plan.id)

    try {
      const priceId = billingCycle === 'monthly'
        ? plan.stripe_price_id_monthly
        : plan.stripe_price_id_yearly

      if (!priceId) {
        // Fallback: use Stripe Payment Link if price ID isn't configured
        const planKey = plan.name as 'starter' | 'pro' | 'enterprise'
        const cycle = billingCycle === 'yearly' ? 'annual' : 'monthly'
        try {
          const paymentUrl = getSubscriptionLink(planKey, cycle)
          window.location.href = paymentUrl
        } catch {
          throw new Error('Price ID not configured for this plan')
        }
        setLoadingPlanId(null)
        return
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          billingPeriod: billingCycle,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout')
      setLoadingPlanId(null)
    }
  }

  // Calculate savings for yearly billing
  const calculateSavings = (monthly: number, yearly: number) => {
    if (monthly === 0 || yearly === 0) return 0
    const yearlyIfMonthly = monthly * 12
    const savings = yearlyIfMonthly - yearly
    const percentage = Math.round((savings / yearlyIfMonthly) * 100)
    return percentage
  }

  return (
    <div>
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-zinc-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-3 sm:px-6 py-2 rounded-md font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Yearly
            {plans.some(p => calculateSavings(p.price_monthly, p.price_yearly) > 0) && (
              <span className="ml-2 text-emerald-600 text-sm">
                Save up to 20%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto px-4 sm:px-6">
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
          const displayPrice = billingCycle === 'yearly' ? price / 12 : price
          const isCurrentPlan = plan.name === currentPlan
          const isLoading = loadingPlanId === plan.id
          const savings = calculateSavings(plan.price_monthly, plan.price_yearly)

          return (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-2xl p-8 border-2 transition-all
                ${plan.is_popular
                  ? 'border-primary shadow-lg sm:scale-105'
                  : 'border-zinc-200 hover:border-zinc-300'
                }
                ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}
              `}
            >
              {/* Popular Badge */}
              {plan.is_popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
                  Most Popular
                </span>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full">
                  Current Plan
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                  {plan.display_name}
                </h3>
                <p className="text-zinc-600 text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-zinc-900">
                    ${Math.round(displayPrice)}
                  </span>
                  <span className="text-zinc-500">
                    /mo
                  </span>
                </div>
                {billingCycle === 'yearly' && price > 0 && (
                  <p className="text-sm text-zinc-500 mt-1">
                    ${price} billed annually {savings > 0 && `(save ${savings}%)`}
                  </p>
                )}
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-8 min-h-[240px]">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
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
                    <span className="text-zinc-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleCheckout(plan)}
                disabled={isCurrentPlan || isLoading}
                className={`
                  w-full py-6 text-sm sm:text-base font-semibold rounded-lg transition-all
                  ${plan.is_popular
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : isCurrentPlan
                    ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : plan.name === 'free' ? (
                  'Get Started Free'
                ) : (
                  `Upgrade to ${plan.display_name}`
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
