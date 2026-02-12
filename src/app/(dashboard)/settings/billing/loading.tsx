export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Current plan card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-5 w-28 bg-zinc-200 rounded" />
            <div className="h-3 w-48 bg-zinc-100 rounded" />
          </div>
          <div className="h-8 w-20 bg-zinc-200 rounded-full" />
        </div>
        <div className="flex items-baseline gap-1 mb-4">
          <div className="h-8 w-16 bg-zinc-200 rounded" />
          <div className="h-4 w-12 bg-zinc-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-zinc-200 rounded-lg" />
      </div>

      {/* Credits section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-5 w-24 bg-zinc-200 rounded" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-zinc-200 rounded-full" />
            <div className="space-y-2">
              <div className="h-6 w-20 bg-zinc-200 rounded" />
              <div className="h-3 w-32 bg-zinc-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Credit packages */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="h-5 w-36 bg-zinc-200 rounded mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-6 space-y-3">
              <div className="h-5 w-24 bg-zinc-200 rounded" />
              <div className="h-8 w-16 bg-zinc-200 rounded" />
              <div className="h-3 w-32 bg-zinc-100 rounded" />
              <div className="h-10 w-full bg-zinc-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Usage history */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="h-5 w-28 bg-zinc-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-zinc-100">
              <div className="h-4 w-40 bg-zinc-100 rounded" />
              <div className="h-4 w-16 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
