'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AffiliateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">There was an error loading the Partner Hub.</p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  )
}
