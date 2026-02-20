export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-52 bg-zinc-200 rounded" />
      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-full bg-zinc-100 rounded" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-7 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-full bg-zinc-100 rounded" />
          <div className="h-4 w-3/4 bg-zinc-100 rounded" />
          <div className="h-32 w-full bg-zinc-100 rounded" />
          <div className="h-7 w-40 bg-zinc-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full bg-zinc-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
