/**
 * Auto-Submit Onboarding
 * Handles post-OAuth redirect: reads form data from localStorage,
 * submits to /api/onboarding/setup, shows loading, redirects to dashboard.
 *
 * Includes retry logic for 401 responses, since auth cookies may not be
 * fully propagated immediately after the OAuth callback redirect.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getStoredRefCode } from '@/components/affiliate/affiliate-ref-capture'

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

    const RETRY_KEY = 'cursive_onboarding_retries'
    const MAX_SUBMIT_ATTEMPTS = 3

    const submit = async () => {
      // Check how many times we've already failed to submit.
      // This counter lives in localStorage so it survives page reloads.
      const submitAttempts = parseInt(localStorage.getItem(RETRY_KEY) || '0', 10)
      if (submitAttempts >= MAX_SUBMIT_ATTEMPTS) {
        localStorage.removeItem('cursive_onboarding')
        localStorage.removeItem(RETRY_KEY)
        setError('Setup failed after multiple attempts. Please start over.')
        setStatus('error')
        return
      }

      try {
        // If returning=true was set by the OAuth callback, verify whether the
        // workspace was already created (e.g. user hit back after a successful
        // onboarding, or the OAuth flow ran twice). Skip straight to dashboard
        // rather than risking a duplicate-workspace attempt.
        //
        // We probe an endpoint that calls getCurrentUser() (which queries the
        // users table). A 200 means a platform user profile already exists →
        // workspace is set up → go to dashboard immediately.
        if (isReturning) {
          try {
            const workspaceCheckRes = await fetch('/api/ai-studio/workspaces')
            if (workspaceCheckRes.ok) {
              // Platform user profile exists — workspace already set up
              router.replace('/dashboard')
              return
            }
          } catch {
            // Network error — fall through to normal submit flow
          }
        }

        const stored = localStorage.getItem('cursive_onboarding')
        let onboardingData: any

        let parsedStored: any = null
        if (stored) {
          try {
            parsedStored = JSON.parse(stored)
          } catch {
            // Malformed data — clear it and fall through to fetch from auth
            localStorage.removeItem('cursive_onboarding')
          }
        }

        if (!parsedStored) {
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
          // Remove the isMarketplace flag before sending to API
          const { isMarketplace: _, ...rest } = parsedStored
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

          const setupHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
          const storedRef = getStoredRefCode()
          if (storedRef) setupHeaders['x-affiliate-ref'] = storedRef
          lastResponse = await fetch('/api/onboarding/setup', {
            method: 'POST',
            headers: setupHeaders,
            body: JSON.stringify(onboardingData),
          })

          // 401 = session not ready yet; retry
          // After 2 retries, verify session is still valid to avoid wasting time on expired auth
          if (lastResponse.status === 401 && attempt < MAX_RETRIES) {
            if (attempt === 2) {
              try {
                const sessionCheck = await fetch('/api/auth/user')
                if (!sessionCheck.ok) {
                  // Session is genuinely invalid — stop retrying
                  break
                }
              } catch {
                // Network error — let retry logic continue
              }
            }
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
            localStorage.removeItem('cursive_onboarding')
            localStorage.removeItem(RETRY_KEY)
            router.push(isMarketplace ? '/marketplace' : '/dashboard?onboarding=complete')
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
          const body = await lastResponse.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to create workspace')
        }

        // Fire both post-onboarding tasks in parallel (non-blocking):
        // 1. Populate initial leads immediately
        // 2. Auto-provision their SuperPixel so website visitor tracking is ready
        //
        // Both make external AudienceLab API calls that can be slow — cap at 12s
        // so users are never stuck on the spinner waiting for a background task.
        const email = onboardingData.email || ''
        const emailDomain = email.includes('@') ? email.split('@')[1] : null
        const businessName = onboardingData.companyName || onboardingData.businessName || onboardingData.fullName || 'My Business'

        function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 12000) {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), timeoutMs)
          return fetch(url, { ...options, signal: controller.signal })
            .catch(() => null)
            .finally(() => clearTimeout(id))
        }

        const CONSUMER_EMAIL_DOMAINS = ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'icloud.com', 'me.com', 'aol.com', 'msn.com', 'protonmail.com', 'proton.me']

        await Promise.allSettled([
          // Populate leads immediately (don't wait for 8am cron)
          // Only for business users — partner role has no industry_segment and returns 400
          onboardingData.role === 'business' || !onboardingData.role
            ? fetchWithTimeout('/api/leads/populate-initial', { method: 'POST' })
            : Promise.resolve(),

          // Auto-provision SuperPixel using email domain as the website URL
          // If no valid domain, skip silently — user can do it from /settings/pixel
          emailDomain && !CONSUMER_EMAIL_DOMAINS.includes(emailDomain.toLowerCase())
            ? fetchWithTimeout('/api/pixel/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  website_url: `https://${emailDomain}`,
                  website_name: businessName,
                }),
              })
            : Promise.resolve(),
        ])

        // Clear storage (including retry counter) and redirect to dashboard
        localStorage.removeItem('cursive_onboarding')
        localStorage.removeItem(RETRY_KEY)
        router.push(isMarketplace ? '/marketplace' : '/dashboard?onboarding=complete')
      } catch (err: any) {
        // Increment the persistent failure counter so reloads don't cause
        // an infinite retry loop.
        const prevAttempts = parseInt(localStorage.getItem(RETRY_KEY) || '0', 10)
        const nextAttempts = prevAttempts + 1
        if (nextAttempts >= MAX_SUBMIT_ATTEMPTS) {
          // Give up — clear stored data so the user must restart the flow.
          localStorage.removeItem('cursive_onboarding')
          localStorage.removeItem(RETRY_KEY)
        } else {
          localStorage.setItem(RETRY_KEY, String(nextAttempts))
        }

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
                localStorage.removeItem('cursive_onboarding')
                localStorage.removeItem('cursive_onboarding_retries')
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
