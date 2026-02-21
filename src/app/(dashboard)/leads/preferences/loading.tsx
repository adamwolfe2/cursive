import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function PreferencesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Preferences form card */}
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form field rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Secondary settings card */}
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
