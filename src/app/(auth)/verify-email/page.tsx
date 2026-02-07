'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setEmail(session.user.email || null)

        // Check if email is already verified
        if (session.user.email_confirmed_at) {
          router.push('/onboarding')
        }
      }
    }

    checkAuth()
  }, [router])

  const handleResendVerification = async () => {
    if (!email) {
      setError('No email found. Please sign up again.')
      return
    }

    setLoading(true)
    setError(null)
    setResendSuccess(false)

    const supabase = createClient()

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (resendError) {
      setError(resendError.message)
      setLoading(false)
      return
    }

    setResendSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-xl font-medium text-zinc-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-[13px] text-zinc-600">
            We sent a verification link to {email || 'your email'}
          </p>
        </div>

        {/* Info Message */}
        <div className="rounded-lg bg-zinc-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-[13px] font-medium text-zinc-900">
                Check your email
              </h3>
              <p className="mt-2 text-[13px] text-zinc-600">
                Click the verification link in the email to activate your account.
                If you don't see it, check your spam folder.
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {resendSuccess && (
          <div className="rounded-lg bg-primary/5 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-[13px] font-medium text-primary">
                  Verification email sent
                </h3>
                <p className="mt-2 text-[13px] text-primary">
                  Please check your email inbox.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-[13px] font-medium text-red-700">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Resend Button */}
        <div>
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="h-9 px-4 w-full text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>

        {/* Help Text */}
        <div className="rounded-lg bg-white border border-zinc-200 p-4">
          <h3 className="text-[13px] font-medium text-zinc-900 mb-2">
            Having trouble?
          </h3>
          <ul className="space-y-1 text-[13px] text-zinc-600 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try resending</li>
          </ul>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-[13px] font-medium text-zinc-900 hover:text-zinc-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
