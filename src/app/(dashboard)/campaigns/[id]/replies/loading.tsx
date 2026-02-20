export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-200 rounded-full" />
              <div className="space-y-1">
                <div className="h-4 w-32 bg-zinc-200 rounded" />
                <div className="h-3 w-24 bg-zinc-100 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-100 rounded" />
              <div className="h-4 w-4/5 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
