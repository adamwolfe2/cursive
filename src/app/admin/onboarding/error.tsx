'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report to Sentry — error boundary is the last line of defense
    console.error('[admin/onboarding] Error boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 p-6">
      <div className="rounded-full bg-red-50 p-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">Could not load onboarding pipeline</h2>
      <p className="text-sm text-zinc-500 text-center max-w-md">
        Something went wrong loading client data. This is usually transient — try again, or check the automation logs.
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-400 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/admin/dashboard"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
