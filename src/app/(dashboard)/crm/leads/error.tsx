'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { safeError } from '@/lib/utils/log-sanitizer'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    safeError('[CRMLeads] Page error:', error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We encountered an error loading this page. Your data is safe.
          </p>
        </div>
        {error.digest && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">If this problem persists, please contact support.</p>
      </div>
    </div>
  )
}
