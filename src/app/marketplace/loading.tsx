// Marketplace page loading skeleton

export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-zinc-200 rounded" />
            <div className="h-4 w-32 bg-zinc-100 rounded" />
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="h-9 w-32 bg-zinc-100 rounded-lg" />
            <div className="h-9 w-44 bg-zinc-100 rounded-lg" />
            <div className="h-9 w-24 bg-zinc-100 rounded-lg" />
            <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
            <div className="h-9 w-36 bg-zinc-200 rounded-lg" />
            <div className="h-9 w-28 bg-zinc-100 rounded-lg" />
          </div>
          {/* Mobile header buttons */}
          <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto">
            <div className="h-11 w-24 bg-zinc-100 rounded-lg flex-1 sm:flex-initial" />
            <div className="h-11 w-20 bg-zinc-100 rounded-lg" />
            <div className="h-11 w-24 bg-zinc-200 rounded-lg" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop Only */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-14 bg-zinc-200 rounded" />
                <div className="h-4 w-16 bg-zinc-100 rounded" />
              </div>
              {/* Filter sections */}
              {[1, 2, 3, 4].map((section) => (
                <div key={section} className="mb-4">
                  <div className="h-3 w-20 bg-zinc-200 rounded mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="h-3.5 w-3.5 bg-zinc-100 rounded" />
                        <div className="h-3 w-24 bg-zinc-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-24 bg-zinc-100 rounded-lg hidden lg:block" />
              <div className="h-11 lg:h-9 w-40 bg-zinc-100 rounded-lg" />
            </div>

            {/* Lead Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 bg-zinc-100 rounded mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-zinc-200 rounded" />
                          <div className="h-3 w-24 bg-zinc-100 rounded" />
                        </div>
                        <div className="h-4 w-14 bg-zinc-200 rounded" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 w-36 bg-zinc-200 rounded" />
                        <div className="h-3 w-44 bg-zinc-100 rounded" />
                        <div className="h-3 w-28 bg-zinc-100 rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-12 bg-zinc-100 rounded" />
                        <div className="h-5 w-14 bg-zinc-100 rounded" />
                        <div className="h-5 w-16 bg-zinc-100 rounded" />
                      </div>
                      <div className="pt-3 border-t border-zinc-100">
                        <div className="flex items-center gap-4">
                          <div className="h-3 w-32 bg-zinc-100 rounded" />
                          <div className="h-3 w-24 bg-zinc-100 rounded" />
                        </div>
                      </div>
                      <div className="h-9 w-full bg-zinc-200 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="h-4 w-48 bg-zinc-100 rounded" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-20 bg-zinc-100 rounded-lg" />
                <div className="h-4 w-24 bg-zinc-100 rounded" />
                <div className="h-9 w-16 bg-zinc-100 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
