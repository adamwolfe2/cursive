/**
 * Auto-Submit Onboarding
 * Handles post-OAuth redirect: reads form data from sessionStorage,
 * submits to /api/onboarding/setup, shows loading, redirects to dashboard.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AutoSubmitOnboardingProps {
  isMarketplace: boolean
}

export function AutoSubmitOnboarding({ isMarketplace }: AutoSubmitOnboardingProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const submit = async () => {
      try {
        const stored = sessionStorage.getItem('cursive_onboarding')
        if (!stored) {
          // No stored data — send them back to the quiz
          router.replace('/welcome')
          return
        }

        const data = JSON.parse(stored)
        // Remove the isMarketplace flag before sending to API
        const { isMarketplace: _, ...onboardingData } = data

        const res = await fetch('/api/onboarding/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(onboardingData),
        })

        if (res.status === 409) {
          // Already has workspace
          sessionStorage.removeItem('cursive_onboarding')
          router.push(isMarketplace ? '/marketplace' : '/dashboard')
          return
        }

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error || 'Failed to create workspace')
        }

        // Success — clear storage and redirect
        sessionStorage.removeItem('cursive_onboarding')
        router.push(isMarketplace ? '/marketplace' : '/dashboard')
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
        setStatus('error')
      }
    }

    submit()
  }, [router, isMarketplace])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <Image src="/cursive-logo.png" alt="Cursive" width={64} height={64} className="mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/welcome')}
            className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <Image src="/cursive-logo.png" alt="Cursive" width={64} height={64} className="mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Setting up your account...</h2>
        <p className="text-sm text-muted-foreground">This will only take a moment.</p>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
