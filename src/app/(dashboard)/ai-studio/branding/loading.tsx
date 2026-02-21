import { Skeleton } from '@/components/ui/skeleton'

export default function AiStudioBrandingLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  )
}
