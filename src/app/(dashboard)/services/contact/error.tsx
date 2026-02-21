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

export default function ServiceContactError({ error, reset }: ErrorProps) {
  useEffect(() => {
    safeError('[ServiceContact] Error boundary triggered:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Failed to load contact form</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || 'Something went wrong. Please try again.'}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={reset}>Try Again</Button>
        <Button variant="ghost" asChild>
          <Link href="/services">Back to Services</Link>
        </Button>
      </div>
    </div>
  )
}
