export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="h-48 w-full bg-zinc-100" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-full bg-zinc-200 rounded" />
              <div className="h-3 w-2/3 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
