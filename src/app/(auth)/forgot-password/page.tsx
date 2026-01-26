'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <h2 className="mt-6 text-center text-xl font-medium text-zinc-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-[13px] text-zinc-600">
              We sent a password reset link to {email}
            </p>
          </div>

          {/* Success Message */}
          <div className="rounded-lg bg-emerald-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-[13px] font-medium text-emerald-700">
                  Password reset email sent
                </h3>
                <p className="mt-2 text-[13px] text-emerald-600">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
              </div>
            </div>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-xl font-medium text-zinc-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-[13px] text-zinc-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

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

        {/* Reset Password Form */}
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
              placeholder="Email address"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 w-full text-[13px] font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </div>
        </form>

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
