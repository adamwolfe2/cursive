export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-zinc-200 rounded" />
          <div className="h-4 w-56 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="h-3 w-20 bg-zinc-200 rounded mb-3" />
            <div className="h-8 w-16 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-3">
          <div className="h-4 w-32 bg-zinc-200 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-zinc-100 px-6 py-4 flex gap-6">
            <div className="h-4 w-32 bg-zinc-100 rounded" />
            <div className="h-4 w-24 bg-zinc-100 rounded" />
            <div className="h-4 w-20 bg-zinc-100 rounded" />
            <div className="h-4 w-16 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
