import { Skeleton } from '@/components/ui/skeleton'

export default function NewCampaignLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            {s < 3 && <Skeleton className="h-0.5 w-12" />}
          </div>
        ))}
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}
