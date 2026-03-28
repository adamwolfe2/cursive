/**
 * Email Sequences Page
 * List and manage automated email sequences
 */

import { Suspense } from 'react'
import { EmailSequencesList } from '@/components/email-sequences/email-sequences-list'
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
    <div className="px-4 sm:px-6 py-6 max-w-7xl">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Sequences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create automated email sequences to nurture leads
          </p>
        </div>
        <Link
          href="/email-sequences/new"
          className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Sequence
        </Link>
      </div>

      <Suspense fallback={<SequencesListSkeleton />}>
        <EmailSequencesList />
      </Suspense>
    </div>
  )
}
