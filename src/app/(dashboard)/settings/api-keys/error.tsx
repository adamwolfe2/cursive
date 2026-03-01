'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { safeError } from '@/lib/utils/log-sanitizer'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ApiKeysError({ error, reset }: ErrorProps) {
  useEffect(() => {
    safeError('[SettingsApiKeys] Page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Failed to load API key settings
      </h2>
      <p className="text-sm text-muted-foreground mb-2 max-w-md">
        {error.message || 'Something went wrong while loading this page. Please try again.'}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-6 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={reset}>
          Try Again
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
