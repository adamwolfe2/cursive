export default function Loading() {
  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-zinc-200 rounded" />
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
          <div className="h-9 w-24 bg-zinc-200 rounded-lg" />
          <div className="h-9 w-28 bg-zinc-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-zinc-200 bg-white p-5">
            <div className="h-3 w-20 bg-zinc-200 rounded mb-3" />
            <div className="h-7 w-12 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-lg border border-zinc-200 bg-white" />
        ))}
      </div>
    </div>
  )
}
