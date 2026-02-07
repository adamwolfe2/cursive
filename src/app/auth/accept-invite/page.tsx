'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invalid invitation link. Please check the link and try again.')
      return
    }

    // Check if user is logged in
    checkAuthAndAccept()
  }, [token])

  async function checkAuthAndAccept() {
    try {
      setStatus('accepting')

      const res = await fetch('/api/team/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          // User not logged in - redirect to login with return URL
          router.push(`/auth/login?redirect=/auth/accept-invite?token=${token}`)
          return
        }
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setStatus('success')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl bg-white p-8 shadow-lg border border-zinc-200">
        {status === 'loading' || status === 'accepting' ? (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Accepting Invitation...
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Please wait while we process your invitation.
            </p>
          </div>
        ) : status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Welcome to the Team!
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Your invitation has been accepted. Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-zinc-900">
              Invitation Error
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/auth/login"
                className="block w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 text-center"
              >
                Sign In
              </Link>
              <Link
                href="/"
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 text-center"
              >
                Go Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl bg-white p-8 shadow-lg border border-zinc-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-zinc-900">
            Loading...
          </h1>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Suspense fallback={<LoadingFallback />}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  )
}
