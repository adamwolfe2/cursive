'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setIsValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  if (!isValidToken && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <h2 className="mt-6 text-center text-xl font-medium text-zinc-900">
              Reset link expired
            </h2>
          </div>

          {/* Error Message */}
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-[13px] font-medium text-red-700">{error}</h3>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="h-9 px-4 w-full text-[13px] font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-all duration-150 flex items-center justify-center"
            >
              Request new reset link
            </Link>
            <Link
              href="/login"
              className="h-9 px-4 w-full text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 flex items-center justify-center"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <h2 className="mt-6 text-center text-xl font-medium text-zinc-900">
              Password reset successful
            </h2>
          </div>

          {/* Success Message */}
          <div className="rounded-lg bg-primary/5 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-[13px] font-medium text-primary">
                  Your password has been updated
                </h3>
                <p className="mt-2 text-[13px] text-primary">
                  Redirecting to login...
                </p>
              </div>
            </div>
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
            Set new password
          </h2>
          <p className="mt-2 text-center text-[13px] text-zinc-600">
            Enter your new password below
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
          <div className="space-y-3">
            <div>
              <label htmlFor="password" className="sr-only">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
                placeholder="New password (min. 8 characters)"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
                placeholder="Confirm password"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 w-full text-[13px] font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting password...' : 'Reset password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
