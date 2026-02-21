import { Skeleton } from '@/components/ui/skeleton'

export default function OffersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
