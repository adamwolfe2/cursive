import { Skeleton } from '@/components/ui/skeleton'

export default function ActivitiesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36 rounded" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
