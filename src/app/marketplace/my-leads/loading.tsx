// My Leads page loading skeleton

export default function MyLeadsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-zinc-200 rounded" />
            <div className="h-4 w-64 bg-zinc-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-32 bg-zinc-100 rounded-lg" />
            <div className="h-9 w-40 bg-zinc-200 rounded-lg" />
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-zinc-100 rounded" />
                <div className="h-8 w-16 bg-zinc-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-zinc-100 rounded" />
                <div className="h-8 w-16 bg-zinc-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-44 bg-zinc-200 rounded-lg" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-zinc-100 rounded mb-2" />
                <div className="h-10 w-full bg-zinc-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center gap-4">
            {['w-20', 'w-16', 'w-24', 'w-20', 'w-36', 'w-24', 'w-20', 'w-16', 'w-24'].map((width, i) => (
              <div key={i} className={`h-4 ${width} bg-zinc-200 rounded`} />
            ))}
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-zinc-100">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-24 bg-zinc-200 rounded" />
                <div className="h-4 w-20 bg-zinc-100 rounded" />
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-zinc-200 rounded" />
                  <div className="h-3 w-20 bg-zinc-100 rounded" />
                </div>
                <div className="h-4 w-24 bg-zinc-100 rounded" />
                <div className="h-4 w-36 bg-zinc-100 rounded" />
                <div className="h-4 w-24 bg-zinc-100 rounded" />
                <div className="h-4 w-24 bg-zinc-100 rounded" />
                <div className="h-5 w-10 bg-zinc-100 rounded" />
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-zinc-100 rounded" />
                  <div className="h-3 w-12 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
