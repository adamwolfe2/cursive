export default function MyLeadsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-100 rounded" />
        </div>
        <div className="h-10 w-48 bg-zinc-200 rounded-lg" />
      </div>

      {/* Targeting status banner */}
      <div className="h-16 rounded-lg border border-zinc-200 bg-zinc-50" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="h-3 w-16 bg-zinc-200 rounded mb-2" />
            <div className="h-7 w-12 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* Filter tabs + search bar */}
        <div className="border-b border-zinc-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-16 bg-zinc-100 rounded-md" />
            ))}
          </div>
          <div className="sm:ml-auto h-9 w-64 bg-zinc-100 rounded-md" />
        </div>

        {/* Table header */}
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 flex gap-6">
          <div className="h-4 w-4 bg-zinc-200 rounded" />
          <div className="h-4 w-32 bg-zinc-200 rounded" />
          <div className="h-4 w-24 bg-zinc-200 rounded" />
          <div className="h-4 w-28 bg-zinc-200 rounded" />
          <div className="h-4 w-20 bg-zinc-200 rounded" />
          <div className="h-4 w-16 bg-zinc-200 rounded ml-auto" />
        </div>

        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-zinc-100 px-6 py-4 flex gap-6 items-center">
            <div className="h-4 w-4 bg-zinc-100 rounded" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 bg-zinc-100 rounded" />
              <div className="h-3 w-48 bg-zinc-50 rounded" />
            </div>
            <div className="h-4 w-28 bg-zinc-100 rounded" />
            <div className="h-4 w-24 bg-zinc-100 rounded" />
            <div className="h-6 w-16 bg-zinc-100 rounded-full" />
            <div className="h-4 w-20 bg-zinc-100 rounded" />
            <div className="h-8 w-24 bg-zinc-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
