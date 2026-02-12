export default function IntegrationsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Info banner skeleton */}
      <div className="rounded-xl border border-zinc-200 p-4">
        <div className="flex gap-3">
          <div className="h-5 w-5 bg-zinc-200 rounded" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-48 bg-zinc-200 rounded" />
            <div className="h-3 w-full bg-zinc-100 rounded" />
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="space-y-4">
        <div className="h-5 w-52 bg-zinc-200 rounded" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-zinc-200 rounded-lg" />
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-zinc-200 rounded" />
                  <div className="h-3 w-40 bg-zinc-100 rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-zinc-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-5 w-36 bg-zinc-200 rounded" />
          <div className="h-3 w-72 bg-zinc-100 rounded" />
          <div className="h-10 w-full bg-zinc-100 rounded-lg" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-zinc-200 p-3 h-20" />
            ))}
          </div>
        </div>
      </div>

      {/* CRM section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="h-5 w-44 bg-zinc-200 rounded mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-4 h-28" />
          ))}
        </div>
      </div>
    </div>
  )
}
