'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UpgradeButton } from '@/components/billing/upgrade-button'
import { PLAN_CONFIGS } from '@/lib/stripe/client'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutStatus = searchParams.get('checkout')

  const plans = [
    {
      id: 'free',
      name: PLAN_CONFIGS.free.name,
      price: PLAN_CONFIGS.free.price,
      description: 'Perfect for trying out the platform',
      features: PLAN_CONFIGS.free.features,
      cta: 'Current Plan',
      popular: false,
    },
    {
      id: 'pro',
      name: PLAN_CONFIGS.pro.name,
      price: PLAN_CONFIGS.pro.price,
      priceYearly: 480, // $40/mo billed yearly
      description: 'For serious lead generation',
      features: PLAN_CONFIGS.pro.features,
      cta: 'Upgrade to Pro',
      popular: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Choose the plan that's right for your business
        </p>
      </div>

      {/* Checkout status notification */}
      {checkoutStatus === 'success' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Subscription activated!
              </h3>
              <p className="mt-2 text-sm text-green-700">
                Your Pro subscription is now active. Enjoy unlimited access!
              </p>
            </div>
          </div>
        </div>
      )}

      {checkoutStatus === 'cancelled' && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Checkout cancelled
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                You can upgrade anytime. Questions?{' '}
                <a href="mailto:support@openinfo.com" className="underline">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Billing period toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span
          className={`text-sm font-medium ${
            billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() =>
            setBillingPeriod(
              billingPeriod === 'monthly' ? 'yearly' : 'monthly'
            )
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${
            billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          Yearly
          <span className="ml-1 text-green-600 font-semibold">
            (Save 20%)
          </span>
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const displayPrice =
            plan.id === 'pro' && billingPeriod === 'yearly'
              ? plan.priceYearly
              : plan.price

          const pricePerMonth =
            plan.id === 'pro' && billingPeriod === 'yearly'
              ? displayPrice! / 12
              : displayPrice

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-blue-500 shadow-xl'
                  : 'border-gray-200 shadow'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    ${pricePerMonth}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="ml-2 text-gray-500">/month</span>
                  )}
                </div>
                {plan.id === 'pro' && billingPeriod === 'yearly' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Billed ${displayPrice} annually
                  </p>
                )}
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-6 w-6 flex-shrink-0 text-green-500"
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
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <button
                  disabled
                  className="w-full rounded-lg bg-gray-100 px-6 py-3 text-base font-semibold text-gray-400 cursor-not-allowed"
                >
                  {plan.cta}
                </button>
              ) : (
                <UpgradeButton billingPeriod={billingPeriod} />
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto pt-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently asked questions
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What are credits?
            </h3>
            <p className="text-gray-600">
              Credits are used to reveal contact emails in the People Search
              feature. Each email reveal costs 1 credit. Your credit balance
              resets daily at midnight UTC.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time from the
              billing settings. You'll continue to have Pro access until the
              end of your billing period.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What happens when I downgrade to Free?
            </h3>
            <p className="text-gray-600">
              Your queries will be paused but not deleted. You can reactivate
              one query on the Free plan. All your data remains accessible.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-600">
              We offer a 14-day money-back guarantee. If you're not satisfied
              within the first 14 days, contact support for a full refund.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Can I switch between monthly and yearly?
            </h3>
            <p className="text-gray-600">
              Yes, you can switch billing periods from your billing settings.
              Changes will take effect at the start of your next billing cycle.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 rounded-2xl p-12 text-center max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to grow your pipeline?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Start generating high-quality leads today with intent-based
          prospecting.
        </p>
        <UpgradeButton billingPeriod={billingPeriod} />
      </div>
    </div>
  )
}
