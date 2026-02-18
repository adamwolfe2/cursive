export default function WebsiteVisitorsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="h-3 w-20 bg-zinc-200 rounded mb-3" />
            <div className="h-8 w-12 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      {/* Visitor cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-zinc-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-zinc-200 rounded" />
                <div className="h-3 w-48 bg-zinc-100 rounded" />
              </div>
              <div className="h-8 w-20 bg-zinc-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
