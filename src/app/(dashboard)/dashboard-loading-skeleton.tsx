// Enhanced loading skeleton for dashboard with shimmer effect

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-8 w-64 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="h-4 w-40 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
          </div>
          <div className="h-10 w-24 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
        </div>
      </div>

      {/* Stats Cards Skeleton - exactly 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background p-6"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-24 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-10 w-20 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
              </div>
              <div className="h-12 w-12 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leads Section Skeleton */}
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
          <div className="h-5 w-20 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
        </div>

        {/* Lead Items */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border"
            >
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-4 w-32 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
              </div>
              <div className="h-6 w-16 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-24 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-4 w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
