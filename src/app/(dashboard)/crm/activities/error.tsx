'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ActivitiesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[ActivitiesPage] error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Failed to load the activities page. You can try again or contact support if the issue
        persists.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
