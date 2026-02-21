import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignSuccessLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-9 w-36" />
    </div>
  )
}
