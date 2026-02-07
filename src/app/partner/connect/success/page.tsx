'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

function PartnerConnectSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const partnerId = searchParams.get('partner_id')

  useEffect(() => {
    async function verifyOnboarding() {
      if (!partnerId) {
        setStatus('error')
        setMessage('Invalid partner ID')
        return
      }

      try {
        // Verify Stripe onboarding completed
        const response = await fetch(`/api/partner/connect/verify?partner_id=${partnerId}`)
        const data = await response.json()

        if (data.onboardingComplete) {
          setStatus('success')
          setMessage('Your Stripe Connect account is now active!')
        } else {
          setStatus('error')
          setMessage('Stripe onboarding not complete. Please try again.')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Failed to verify onboarding status')
      }
    }

    verifyOnboarding()
  }, [partnerId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 flex items-center justify-center py-20 px-6">
      <div className="max-w-2xl w-full">
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-primary/10 rounded-full">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
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
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Verifying your account...
            </h1>
            <p className="text-zinc-600">
              Please wait while we confirm your Stripe Connect setup
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-emerald-100 rounded-full">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-zinc-900 mb-4">
              Welcome to the Partner Network!
            </h1>

            <p className="text-lg text-zinc-600 mb-8">
              {message}
            </p>

            <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-semibold text-zinc-900 mb-4">What's Next?</h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-zinc-700">
                    Your account is under review. You'll receive an email notification once approved (usually within 24 hours).
                  </p>
                </div>
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-zinc-700">
                    Once approved, you can start uploading leads via API or dashboard.
                  </p>
                </div>
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-zinc-700">
                    You'll receive weekly payouts automatically via Stripe when your leads are sold.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/partner/dashboard')}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg"
              >
                Go to Dashboard
              </Button>
              <a
                href="https://docs.meetcursive.com/partners"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border-2 border-zinc-900 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors inline-block"
              >
                View Documentation
              </a>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-zinc-900 mb-4">
              Onboarding Incomplete
            </h1>

            <p className="text-lg text-zinc-600 mb-8">
              {message}
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/partner/register')}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg"
              >
                Try Again
              </Button>
              <a
                href="mailto:support@meetcursive.com"
                className="px-8 py-3 border-2 border-zinc-900 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors inline-block"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PartnerConnectSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 flex items-center justify-center py-20 px-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-primary/10 rounded-full">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
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
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <PartnerConnectSuccessContent />
    </Suspense>
  )
}
