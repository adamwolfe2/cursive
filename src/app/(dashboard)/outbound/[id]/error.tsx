'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function WorkflowError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[outbound/detail] page error:', error)
  }, [error])

  return (
    <PageContainer>
      <PageHeader title="Workflow error" />
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{error.message || 'Unknown error'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/outbound">
            <Button variant="outline">Back to workflows</Button>
          </Link>
        </div>
      </Card>
    </PageContainer>
  )
}
