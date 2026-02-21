'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function MfaChallengeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const loadFactor = async () => {
      const supabase = createClient()
      const { data, error: listError } = await supabase.auth.mfa.listFactors()
      if (listError || !data) {
        setError('Unable to load authentication factors. Please try signing in again.')
        setInitializing(false)
        return
      }
      const totp = data.totp.find((f) => f.factor_type === 'totp')
      if (!totp) {
        // No TOTP factor found — redirect to dashboard (MFA not actually required)
        router.push(next)
        return
      }
      setFactorId(totp.id)
      setInitializing(false)
    }
    loadFactor()
  }, [next, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })

    if (challengeError || !challengeData) {
      setError(challengeError?.message || 'Failed to initiate challenge. Please try again.')
      setLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    })

    if (verifyError) {
      setError(verifyError.message || 'Invalid code. Please try again.')
      setLoading(false)
      return
    }

    router.push(next)
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Code
            </label>
            <input
              id="totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              placeholder="000000"
              className="relative block w-full min-h-[44px] rounded-md border-0 px-3 py-2 text-center text-gray-900 text-2xl tracking-[0.5em] ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 placeholder:tracking-[0.5em] focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-2xl"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative flex w-full min-h-[44px] justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Help links */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-gray-500">
            <Link
              href="/support"
              className="font-medium text-primary hover:text-primary/90"
            >
              Can&apos;t access your authenticator?
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/90"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MfaChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <MfaChallengeForm />
    </Suspense>
  )
}
