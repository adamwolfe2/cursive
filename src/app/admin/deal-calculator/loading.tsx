export default function Loading() {
  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-4 w-96 bg-zinc-100 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-5 w-32 bg-zinc-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-zinc-200" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-5 w-32 bg-zinc-200 rounded" />
          <div className="h-64 rounded-lg bg-zinc-200" />
          <div className="h-12 rounded-lg bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}
