export default function TrendsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-zinc-200 rounded" />
        <div className="h-4 w-64 bg-zinc-100 rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-9 w-28 bg-zinc-100 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 bg-white border border-zinc-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-zinc-200 rounded" />
              <div className="h-5 w-12 bg-zinc-100 rounded-full" />
            </div>
            <div className="h-3 w-full bg-zinc-100 rounded" />
            <div className="h-3 w-2/3 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
