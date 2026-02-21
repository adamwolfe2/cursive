/**
 * Email Sequences Page
 * List and manage automated email sequences
 */

import { Suspense } from 'react'
import { EmailSequencesList } from '@/components/email-sequences/email-sequences-list'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import Link from 'next/link'

function SequencesListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EmailSequencesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Sequences</h1>
          <p className="text-muted-foreground mt-2">
            Create automated email sequences to nurture leads
          </p>
        </div>
        <Button asChild>
          <Link href="/email-sequences/new">
            <Plus className="mr-2 h-4 w-4" />
            New Sequence
          </Link>
        </Button>
      </div>

      <Suspense fallback={<SequencesListSkeleton />}>
        <EmailSequencesList />
      </Suspense>
    </div>
  )
}
