import { Skeleton } from '@/components/ui/skeleton'

export default function DealLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <Skeleton className="h-4 w-28" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
