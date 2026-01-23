'use client'

// Global Error Handler
// Catches errors at the root level

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { logError } from '@/lib/logging/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError(error, {
      level: 'fatal',
      page: 'root',
      digest: error.digest,
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
              Critical Error
            </h1>

            <p className="text-[14px] text-zinc-600 mb-8">
              A critical error occurred. Please refresh the page or contact
              support if the problem persists.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
