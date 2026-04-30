export default function Loading() {
  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-zinc-200 rounded" />
        <div className="h-8 w-52 bg-zinc-200 rounded" />
        <div className="h-4 w-80 bg-zinc-100 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-zinc-200 bg-white p-5">
            <div className="h-3 w-20 bg-zinc-200 rounded mb-3" />
            <div className="h-7 w-16 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-lg border border-zinc-200 bg-white" />
    </div>
  )
}
