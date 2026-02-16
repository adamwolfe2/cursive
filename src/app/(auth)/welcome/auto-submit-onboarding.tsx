/**
 * Auto-Submit Onboarding
 * Handles post-OAuth redirect: reads form data from sessionStorage,
 * submits to /api/onboarding/setup, shows loading, redirects to dashboard.
 *
 * Includes retry logic for 401 responses, since auth cookies may not be
 * fully propagated immediately after the OAuth callback redirect.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AutoSubmitOnboardingProps {
  isMarketplace: boolean
}

/** Small helper: wait for `ms` milliseconds */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function AutoSubmitOnboarding({ isMarketplace }: AutoSubmitOnboardingProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  // Guard against double-invocation in React StrictMode / concurrent mode
  const submittedRef = useRef(false)

  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true

    const submit = async () => {
      try {
        const stored = sessionStorage.getItem('cursive_onboarding')
        let onboardingData: any

        if (!stored) {
          // No stored data means user came directly from OAuth (clicked "Sign in with Google")
          // Fetch their Google account info and create a basic workspace
          console.log('[AutoSubmit] No sessionStorage - fetching user data from auth')

          const userResponse = await fetch('/api/auth/user')
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user data')
          }

          const { user } = await userResponse.json()
          if (!user) {
            // No user session - redirect to login
            window.location.href = '/login?reason=no_session'
            return
          }

          // Create basic onboarding data from Google account
          onboardingData = {
            businessName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'My Business',
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            industry: 'Other', // Default industry
            role: 'business', // Default to business role
          }
        } else {
          const data = JSON.parse(stored)
          // Remove the isMarketplace flag before sending to API
          const { isMarketplace: _, ...rest } = data
          onboardingData = rest
        }

        // Retry logic: the auth callback sets cookies but they may not be
        // available to the API route on the very first request after redirect.
        // Retry up to 3 times with exponential back-off for 401 responses.
        const MAX_RETRIES = 3
        let lastResponse: Response | null = null

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            // Wait before retrying: 500ms, 1500ms, 3000ms
            await wait(500 * attempt)
          }

          lastResponse = await fetch('/api/onboarding/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(onboardingData),
          })

          // 401 = session not ready yet; retry
          if (lastResponse.status === 401 && attempt < MAX_RETRIES) {
            continue
          }

          // Any other status: stop retrying
          break
        }

        if (!lastResponse) {
          throw new Error('Failed to contact server')
        }

        if (lastResponse.status === 409) {
          // Already has workspace
          sessionStorage.removeItem('cursive_onboarding')
          router.push(isMarketplace ? '/marketplace' : '/dashboard')
          return
        }

        if (lastResponse.status === 401) {
          // Still unauthorized after retries -- session may have expired
          // or cookies were lost. Clear storage and send to login.
          sessionStorage.removeItem('cursive_onboarding')
          window.location.href = '/login?reason=session_expired'
          return
        }

        if (!lastResponse.ok) {
          const body = await lastResponse.json()
          throw new Error(body.error || 'Failed to create workspace')
        }

        // Success -- clear storage and redirect
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
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => {
                setStatus('loading')
                setError(null)
                submittedRef.current = false
                // Force re-mount by navigating
                window.location.href = '/welcome?returning=true'
              }}
              className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('cursive_onboarding')
                window.location.href = '/welcome'
              }}
              className="h-10 px-6 text-muted-foreground font-medium rounded-lg hover:text-foreground transition-colors"
            >
              Start Over
            </button>
          </div>
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
