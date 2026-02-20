export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="h-40 w-full bg-zinc-100 rounded-lg" />
            <div className="h-4 w-3/4 bg-zinc-200 rounded" />
            <div className="h-3 w-full bg-zinc-100 rounded" />
            <div className="h-8 w-24 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
