'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { safeError } from '@/lib/utils/log-sanitizer'

interface ConversationsErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ConversationsError({ error, reset }: ConversationsErrorProps) {
  const router = useRouter()

  useEffect(() => {
    safeError('[ConversationsPage] Error:', error.message)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border border-destructive/20 bg-destructive/5 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Failed to load conversations</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Something went wrong while loading your conversations inbox. This may be a temporary issue.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  )
}
