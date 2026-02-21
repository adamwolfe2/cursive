import { Skeleton } from '@/components/ui/skeleton'

export default function ConversationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-56 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Conversation rows */}
      <div className="divide-y divide-border rounded-lg border bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  )
}
