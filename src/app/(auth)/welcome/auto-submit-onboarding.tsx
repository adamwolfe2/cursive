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
  isReturning?: boolean
}

/** Small helper: wait for `ms` milliseconds */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function AutoSubmitOnboarding({ isMarketplace, isReturning }: AutoSubmitOnboardingProps) {
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
          const userResponse = await fetch('/api/auth/user')

          // Check if response is actually JSON before parsing
          const contentType = userResponse.headers.get('content-type')
          if (!contentType?.includes('application/json')) {
            // Not JSON - likely an error page. Redirect to login.
            window.location.href = '/login?reason=invalid_session'
            return
          }

          if (!userResponse.ok) {
            window.location.href = '/login?reason=auth_failed'
            return
          }

          const { user } = await userResponse.json()
          if (!user) {
            // No user session - redirect to login
            window.location.href = '/login?reason=no_session'
            return
          }

          // Create onboarding data from Google account using correct API schema fields.
          // Split full_name into firstName/lastName to match the businessSchema.
          const rawName: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
          const nameParts = rawName.trim().split(/\s+/).filter(Boolean)
          const firstName = nameParts[0] || user.email?.split('@')[0] || 'User'
          const lastName = nameParts.slice(1).join(' ') || 'Account'
          // Use email domain (without TLD) as company name for B2B signups
          const emailDomainPart = user.email?.split('@')[1]?.split('.')[0] || ''
          const companyName = emailDomainPart
            ? emailDomainPart.charAt(0).toUpperCase() + emailDomainPart.slice(1)
            : rawName || 'My Business'
          onboardingData = {
            role: 'business',
            firstName,
            lastName,
            email: user.email,
            companyName,
            industry: 'Other',
            monthlyLeadNeed: '25-50 leads', // sensible default for OAuth direct signups
          }
        } else {
          const data = JSON.parse(stored)
          // Remove the isMarketplace flag before sending to API
          const { isMarketplace: _, ...rest } = data
          onboardingData = rest
        }

        // Retry logic: the auth callback sets cookies but they may not be
        // available to the API route on the very first request after redirect.
        // Retry with exponential backoff + jitter for 401 responses.
        const MAX_RETRIES = 5
        let lastResponse: Response | null = null

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            // Exponential backoff: 1000, 2000, 4000, 8000, 16000 + random jitter (0-500ms)
            const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 16000)
            const jitter = Math.floor(Math.random() * 500)
            await wait(baseDelay + jitter)
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
          // Check if it's a slug collision vs already-has-workspace
          const body409 = await lastResponse.json()
          if (body409.workspace_id) {
            // Already has workspace — redirect to dashboard
            sessionStorage.removeItem('cursive_onboarding')
            router.push(isMarketplace ? '/marketplace' : '/dashboard')
            return
          }
          // Slug collision — show specific error
          throw new Error('This workspace name is already taken. Please try a different company name.')
        }

        if (lastResponse.status === 401) {
          // Still unauthorized after retries -- session may have expired
          throw new Error('Your session may have expired. Please sign in again.')
        }

        if (!lastResponse.ok) {
          const body = await lastResponse.json()
          throw new Error(body.error || 'Failed to create workspace')
        }

        // Fire both post-onboarding tasks in parallel (non-blocking):
        // 1. Populate initial leads immediately
        // 2. Auto-provision their SuperPixel so website visitor tracking is ready
        const email = onboardingData.email || ''
        const emailDomain = email.includes('@') ? email.split('@')[1] : null
        const businessName = onboardingData.businessName || onboardingData.fullName || 'My Business'

        await Promise.allSettled([
          // Populate leads immediately (don't wait for 8am cron)
          fetch('/api/leads/populate-initial', { method: 'POST' })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null),

          // Auto-provision SuperPixel using email domain as the website URL
          // If no valid domain, skip silently — user can do it from /settings/pixel
          emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('yahoo') && !emailDomain.includes('hotmail')
            ? fetch('/api/pixel/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  website_url: `https://${emailDomain}`,
                  website_name: businessName,
                }),
              })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
            : Promise.resolve(),
        ])

        // Clear storage and redirect to dashboard
        sessionStorage.removeItem('cursive_onboarding')
        router.push(isMarketplace ? '/marketplace' : '/dashboard')
      } catch (err: any) {
        // Provide specific error messages based on error type
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError('Network error. Please check your connection and try again.')
        } else if (err.message) {
          setError(err.message)
        } else {
          setError('Something went wrong. Please try again.')
        }
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
              onClick={() => window.location.reload()}
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
