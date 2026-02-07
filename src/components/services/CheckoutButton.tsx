'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'
import { VENTURE_STUDIO_CALENDAR_URL, supportsDirectCheckout } from '@/lib/stripe/service-products'
import { trackCheckout } from '@/lib/analytics/service-tier-events'

interface CheckoutButtonProps {
  tierSlug: string
  tierName?: string
  tierPrice?: number
  variant?: 'blue' | 'white' | 'black'
  size?: 'default' | 'large'
  className?: string
}

export function CheckoutButton({
  tierSlug,
  tierName = '',
  tierPrice = 0,
  variant = 'blue',
  size = 'default',
  className = ''
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleCheckout = async () => {
    setLoading(true)

    // Track checkout started
    trackCheckout('started', {
      tier_slug: tierSlug,
      tier_name: tierName,
      tier_price: tierPrice,
    })

    try {
      // Check if this tier uses calendar booking instead of direct checkout
      if (!supportsDirectCheckout(tierSlug)) {
        // Redirect to calendar booking for high-touch tiers (Venture Studio)
        window.location.href = VENTURE_STUDIO_CALENDAR_URL
        return
      }

      // Standard checkout flow for other tiers
      const response = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_slug: tierSlug })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Failed to start checkout')
      setLoading(false)
    }
  }

  // Determine button text based on tier type
  const isCalendarBooking = !supportsDirectCheckout(tierSlug)
  const buttonText = isCalendarBooking ? 'Schedule a Call' : 'Get Started'
  const buttonIcon = isCalendarBooking ? Calendar : ArrowRight

  const variantStyles = {
    blue: 'bg-primary hover:bg-primary/90 text-white',
    white: 'bg-white hover:bg-zinc-50 text-primary',
    black: 'bg-zinc-900 hover:bg-zinc-800 text-white'
  }

  const sizeStyles = {
    default: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {isCalendarBooking ? 'Redirecting...' : 'Processing...'}
        </>
      ) : (
        <>
          {buttonText}
          {buttonIcon === Calendar ? (
            <Calendar className="h-5 w-5" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
        </>
      )}
    </button>
  )
}
