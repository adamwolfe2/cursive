export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded" />
      <div className="bg-white border border-zinc-200 rounded-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-zinc-100 flex gap-4 items-center">
            <div className="h-4 w-4 bg-zinc-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-zinc-200 rounded" />
              <div className="h-3 w-64 bg-zinc-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-zinc-100 rounded-full" />
            <div className="h-4 w-24 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
