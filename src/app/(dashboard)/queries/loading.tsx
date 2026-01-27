// Queries page loading skeleton

export default function QueriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-28 bg-zinc-200 rounded" />
          <div className="h-4 w-72 bg-zinc-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 rounded-lg" />
      </div>

      {/* Query cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 bg-white border border-zinc-200 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="h-5 w-36 bg-zinc-200 rounded" />
              <div className="h-5 w-14 bg-emerald-100 rounded-full" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 w-full bg-zinc-100 rounded" />
              <div className="h-3 w-3/4 bg-zinc-100 rounded" />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-16 bg-zinc-100 rounded-full" />
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <div className="h-3 w-20 bg-zinc-100 rounded" />
              <div className="h-3 w-24 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
