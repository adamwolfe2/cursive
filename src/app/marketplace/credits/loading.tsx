// Credits page loading skeleton

export default function CreditsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-zinc-200 rounded" />
            <div className="h-4 w-64 bg-zinc-100 rounded" />
          </div>
          <div className="h-9 w-40 bg-zinc-100 rounded-lg" />
        </div>

        {/* Current Balance */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-zinc-100 rounded" />
              <div className="h-8 w-32 bg-zinc-200 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-zinc-100 rounded" />
              <div className="h-4 w-40 bg-zinc-100 rounded" />
            </div>
          </div>
        </div>

        {/* Credit Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="h-5 w-24 bg-zinc-200 rounded mb-2" />
              <div className="h-4 w-20 bg-zinc-100 rounded mb-4" />
              <div className="mb-4">
                <div className="h-8 w-16 bg-zinc-200 rounded" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4 w-20 bg-zinc-100 rounded" />
                <div className="h-5 w-16 bg-zinc-100 rounded" />
              </div>
              <div className="h-10 w-full bg-zinc-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <div className="h-5 w-48 bg-zinc-200 rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4">
                <div className="h-4 w-48 bg-zinc-200 rounded mb-3" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-zinc-100 rounded" />
                  <div className="h-3 w-3/4 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
