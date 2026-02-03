'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'

interface CheckoutButtonProps {
  tierSlug: string
  variant?: 'blue' | 'white' | 'black'
  size?: 'default' | 'large'
  className?: string
}

export function CheckoutButton({
  tierSlug,
  variant = 'blue',
  size = 'default',
  className = ''
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleCheckout = async () => {
    setLoading(true)

    try {
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

  const variantStyles = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    white: 'bg-white hover:bg-zinc-50 text-blue-600',
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
          Processing...
        </>
      ) : (
        <>
          Get Started
          <ArrowRight className="h-5 w-5" />
        </>
      )}
    </button>
  )
}
