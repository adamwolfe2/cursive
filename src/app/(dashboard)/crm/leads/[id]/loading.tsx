export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-4 w-4 bg-zinc-200 rounded" />
        <div className="h-4 w-24 bg-zinc-100 rounded" />
      </div>
      <div className="flex items-start gap-6">
        <div className="h-16 w-16 bg-zinc-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-32 bg-zinc-100 rounded" />
          <div className="h-4 w-40 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
            <div className="h-5 w-32 bg-zinc-200 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-24 bg-zinc-100 rounded" />
                <div className="h-4 w-40 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="h-5 w-24 bg-zinc-200 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full bg-zinc-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
