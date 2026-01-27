// Campaigns page loading skeleton

export default function CampaignsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-100 rounded" />
        </div>
        <div className="h-10 w-36 bg-zinc-200 rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-zinc-100 rounded-lg" />
        ))}
      </div>

      {/* Campaign cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 bg-white border border-zinc-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="h-5 w-32 bg-zinc-200 rounded" />
              <div className="h-5 w-16 bg-zinc-100 rounded-full" />
            </div>
            <div className="h-4 w-full bg-zinc-100 rounded mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-100 rounded" />
              <div className="h-3 w-24 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
