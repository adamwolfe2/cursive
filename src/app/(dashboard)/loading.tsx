// Dashboard-wide loading skeleton
// Shows while any dashboard page is loading

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-4 w-64 bg-zinc-100 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-zinc-100 rounded-lg border border-zinc-200" />
        ))}
      </div>

      <div className="h-96 bg-zinc-100 rounded-lg border border-zinc-200" />
    </div>
  )
}
