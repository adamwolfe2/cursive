import { Skeleton } from '@/components/ui/skeleton'

export default function ServiceContactLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
