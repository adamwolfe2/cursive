'use client'

// Global Error Page
// Catches all unhandled errors in the application

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/logging/logger'
import { errorEvents } from '@/lib/analytics/events'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error
    logError(error, {
      page: 'global-error',
      digest: error.digest,
    })

    // Track error in analytics
    errorEvents.errorOccurred(error.message, {
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
          Something went wrong
        </h1>

        <p className="text-[14px] text-zinc-600 mb-8">
          We encountered an unexpected error. Our team has been notified and is
          working on a fix.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 rounded-lg bg-zinc-100 p-4 text-left">
            <p className="text-[12px] font-medium text-zinc-700 mb-2">
              Error Details (Dev Only):
            </p>
            <p className="text-[11px] font-mono text-zinc-600 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-zinc-500 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          <a
            href="/"
            className="text-[13px] text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Go to Homepage
          </a>
        </div>

        {error.digest && (
          <p className="text-[11px] text-zinc-500 mt-6">
            Error ID: {error.digest.slice(0, 8)}
          </p>
        )}
      </div>
    </div>
  )
}
