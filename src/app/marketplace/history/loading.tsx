// Purchase History page loading skeleton

export default function PurchaseHistoryLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-zinc-200 rounded" />
            <div className="h-4 w-56 bg-zinc-100 rounded" />
          </div>
          <div className="h-9 w-40 bg-zinc-200 rounded-lg" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'w-28', value: 'w-16' },
            { label: 'w-20', value: 'w-16' },
            { label: 'w-24', value: 'w-20' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className={`h-4 ${stat.label} bg-zinc-100 rounded mb-2`} />
              <div className={`h-8 ${stat.value} bg-zinc-200 rounded`} />
            </div>
          ))}
        </div>

        {/* Purchases List */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-zinc-200">
            <div className="h-5 w-32 bg-zinc-200 rounded" />
          </div>

          {/* Purchase Rows */}
          <div className="divide-y divide-zinc-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-zinc-200 rounded" />
                    <div className="h-3 w-40 bg-zinc-100 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1.5">
                    <div className="h-4 w-16 bg-zinc-200 rounded" />
                    <div className="h-3 w-24 bg-zinc-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-zinc-100 rounded" />
                  <div className="h-5 w-5 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
