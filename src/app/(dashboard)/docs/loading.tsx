import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function DocsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Doc sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="space-y-1.5 pt-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-3/4" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured article */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  )
}
