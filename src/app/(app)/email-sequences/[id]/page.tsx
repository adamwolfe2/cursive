/**
 * Email Sequence Detail Page
 * View and edit sequence with steps
 */

import { Suspense } from 'react'
import { SequenceBuilder } from '@/components/email-sequences/sequence-builder'

function SequenceBuilderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-3.5 w-32 bg-gray-100 rounded" />
        </div>
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded-lg" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
      {/* Steps */}
      {[1, 2, 3].map(i => (
        <div key={i} className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-3.5 w-full bg-gray-100 rounded" />
          <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export default async function EmailSequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<SequenceBuilderSkeleton />}>
        <SequenceBuilder sequenceId={id} />
      </Suspense>
    </div>
  )
}
