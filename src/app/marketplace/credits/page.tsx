'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { useToast } from '@/lib/hooks/use-toast'
import { useUser } from '@/hooks/use-user'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CREDIT_PACKAGES, type CreditPackage } from '@/lib/constants/credit-packages'
import { getCreditLink } from '@/lib/stripe/payment-links'
import { UpsellBanner } from '@/components/marketplace/UpsellBanner'

// Map credit package IDs to payment link tiers
const PACKAGE_TO_CREDIT_TIER: Record<string, 'leadPurchase' | 'starter' | 'professional' | 'enterprise'> = {
  starter: 'starter',
  growth: 'professional',
  scale: 'professional',
  enterprise: 'enterprise',
}

export default function CreditsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: userLoading } = useUser()
  const [currentBalance, setCurrentBalance] = useState(0)
  const [totalSpend, setTotalSpend] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCanceled, setShowCanceled] = useState(false)
  const [purchasedCredits, setPurchasedCredits] = useState(0)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  const fetchCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/marketplace/credits')
      if (response.ok) {
        const data = await response.json()
        setCurrentBalance(data.balance || 0)
      } else if (response.status === 401) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setIsLoading(false)
    }
    try {
      const statsRes = await fetch('/api/marketplace/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setTotalSpend(statsData.totalSpent || 0)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    fetchCredits()

    // Handle Stripe redirect
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      const credits = urlParams.get('credits')
      if (credits) {
        setPurchasedCredits(parseInt(credits, 10))
      }
      setShowSuccess(true)
      window.history.replaceState({}, '', '/marketplace/credits')
      setTimeout(() => setShowSuccess(false), 5000)
    } else if (urlParams.get('canceled') === 'true') {
      setShowCanceled(true)
      window.history.replaceState({}, '', '/marketplace/credits')
      setTimeout(() => setShowCanceled(false), 5000)
    }
  }, [fetchCredits, user])

  const purchaseCredits = async (pkg: CreditPackage) => {
    setIsPurchasing(pkg.id)
    try {
      const response = await fetch('/api/marketplace/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        // Fallback to payment link if checkout session fails
        const creditTier = PACKAGE_TO_CREDIT_TIER[pkg.id]
        if (creditTier) {
          window.open(getCreditLink(creditTier), '_blank', 'noopener,noreferrer')
        } else {
          const error = await response.json()
          toast({
            title: 'Purchase failed',
            message: error.error || 'Failed to initiate credit purchase',
            type: 'error',
          })
        }
      }
    } catch (error) {
      // Final fallback: use payment link directly
      console.error('Purchase failed, using payment link fallback:', error)
      const creditTier = PACKAGE_TO_CREDIT_TIER[pkg.id]
      if (creditTier) {
        window.open(getCreditLink(creditTier), '_blank', 'noopener,noreferrer')
      } else {
        toast({
          title: 'Purchase failed',
          message: 'An error occurred. Please try again.',
          type: 'error',
        })
      }
    } finally {
      setIsPurchasing(null)
    }
  }

  // Show loading while checking auth
  if (userLoading || !user) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="animate-pulse text-[13px] text-zinc-500">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
          {/* Canceled Message */}
          {showCanceled && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-[13px] font-medium text-amber-900">Purchase Canceled</h3>
                <p className="text-[13px] text-amber-700 mt-1">
                  Your credit purchase was canceled. No charges were made.
                </p>
              </div>
              <button onClick={() => setShowCanceled(false)} className="ml-auto text-amber-600 hover:text-amber-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-[13px] font-medium text-blue-900">Purchase Successful!</h3>
                <p className="text-[13px] text-blue-700 mt-1">
                  {purchasedCredits > 0 ? `${purchasedCredits} credits` : 'Credits'} have been added to your account.
                </p>
              </div>
              <button onClick={() => setShowSuccess(false)} className="ml-auto text-blue-600 hover:text-blue-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Upsell Banner */}
          <UpsellBanner creditsBalance={currentBalance} totalSpend={totalSpend} />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Buy Credits</h1>
              <p className="text-[13px] text-zinc-500 mt-1">Purchase credits to buy leads from the marketplace</p>
            </div>
            <Link
              href="/marketplace"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-2'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Marketplace
            </Link>
          </div>

          {/* Current Balance */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-zinc-500 mb-1">Current Balance</p>
                {isLoading ? (
                  <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-semibold text-zinc-900">${currentBalance.toFixed(2)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-[13px] text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>1 credit = $1 in lead purchases</span>
              </div>
            </div>
          </div>

          {/* Credit Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white border rounded-lg p-6 ${
                  pkg.popular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-[11px] font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">{pkg.name}</h3>
                <p className="text-[13px] text-zinc-500 mb-4">{pkg.credits} credits</p>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-zinc-900">${pkg.price}</span>
                  <span className="text-[13px] text-zinc-500 ml-1">one-time</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[13px] text-zinc-600">
                    ${pkg.pricePerCredit.toFixed(2)}/credit
                  </span>
                  {pkg.savings > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-medium rounded">
                      Save {pkg.savings}%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => purchaseCredits(pkg)}
                  disabled={isPurchasing !== null}
                  className={`w-full h-10 text-[13px] font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                    pkg.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {isPurchasing === pkg.id ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-[15px] font-semibold text-zinc-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <h3 className="text-[14px] font-medium text-zinc-900 mb-2">How do credits work?</h3>
                <p className="text-[13px] text-zinc-600">
                  Credits are used to purchase leads from the marketplace. 1 credit equals $1 toward lead purchases.
                  Lead prices vary based on quality, freshness, and contact information available.
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <h3 className="text-[14px] font-medium text-zinc-900 mb-2">Do credits expire?</h3>
                <p className="text-[13px] text-zinc-600">
                  No, credits never expire. Once purchased, they remain in your account until used.
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <h3 className="text-[14px] font-medium text-zinc-900 mb-2">Can I get a refund?</h3>
                <p className="text-[13px] text-zinc-600">
                  Unused credits can be refunded within 30 days of purchase. Please contact support for refund requests.
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <h3 className="text-[14px] font-medium text-zinc-900 mb-2">What payment methods are accepted?</h3>
                <p className="text-[13px] text-zinc-600">
                  We accept all major credit cards (Visa, Mastercard, American Express) as well as bank transfers for enterprise packages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
