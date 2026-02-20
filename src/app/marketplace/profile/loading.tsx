export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-zinc-200 rounded" />
      <div className="flex items-center gap-4 bg-white border border-zinc-200 rounded-lg p-6">
        <div className="h-20 w-20 bg-zinc-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-32 bg-zinc-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-28 bg-zinc-200 rounded" />
              <div className="h-9 w-full bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
        <div className="h-9 w-24 bg-zinc-200 rounded" />
      </div>
    </div>
  )
}
