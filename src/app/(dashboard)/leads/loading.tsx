// Leads page loading skeleton

export default function LeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-zinc-200 rounded" />
          <div className="h-4 w-56 bg-zinc-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-violet-200 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white border border-zinc-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-20 bg-zinc-200 rounded" />
              <div className="h-4 w-8 bg-zinc-100 rounded" />
            </div>
            <div className="h-8 w-12 bg-zinc-200 rounded mb-2" />
            <div className="h-2 w-full bg-zinc-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 flex items-center gap-4">
          <div className="h-10 flex-1 max-w-md bg-zinc-100 rounded-lg" />
          <div className="h-10 w-24 bg-zinc-100 rounded-lg" />
          <div className="h-10 w-24 bg-zinc-100 rounded-lg" />
        </div>
        {/* Table rows */}
        <div className="divide-y divide-zinc-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-4 w-4 bg-zinc-100 rounded" />
              <div className="h-10 w-10 bg-zinc-100 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-zinc-200 rounded" />
                <div className="h-3 w-24 bg-zinc-100 rounded" />
              </div>
              <div className="h-6 w-12 bg-zinc-100 rounded-full" />
              <div className="h-4 w-24 bg-zinc-100 rounded" />
              <div className="h-4 w-20 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
