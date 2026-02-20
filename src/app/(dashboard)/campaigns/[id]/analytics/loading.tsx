export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2">
            <div className="h-4 w-24 bg-zinc-100 rounded" />
            <div className="h-8 w-16 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-32 bg-zinc-200 rounded" />
        <div className="h-48 w-full bg-zinc-100 rounded" />
      </div>
    </div>
  )
}
