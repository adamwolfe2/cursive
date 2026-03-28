/**
 * Email Sequences Page
 * List and manage automated email sequences
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Email Sequences | Cursive',
  description: 'Create and manage automated email sequences',
}
import { EmailSequencesList } from '@/components/email-sequences/email-sequences-list'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { EMAILBISON_URL } from '@/lib/config/urls'

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

      {/* EmailBison clarity banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-6 text-sm text-blue-900">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
        <div className="flex-1 min-w-0">
          <span className="font-medium">About Email Sequences and EmailBison</span>
          <p className="mt-0.5 text-blue-800">
            Email sequences are managed and drafted here. Active campaigns pushed to EmailBison
            appear in your EmailBison dashboard. Sequences are automatically pushed to EmailBison
            when approved by your admin.
          </p>
        </div>
        <a
          href={EMAILBISON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
        >
          View in EmailBison
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <Suspense fallback={<SequencesListSkeleton />}>
        <EmailSequencesList />
      </Suspense>
    </div>
  )
}
