'use client'

import { useEffect } from 'react'
import { safeError } from '@/lib/utils/log-sanitizer'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    safeError('[MarketplaceHistory] Page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
        We encountered an error loading your purchase history. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-400 mb-4 font-mono">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
