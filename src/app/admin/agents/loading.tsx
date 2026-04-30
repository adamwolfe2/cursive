export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-zinc-200 bg-white p-5">
            <div className="h-3 w-20 bg-zinc-200 rounded mb-3" />
            <div className="h-7 w-12 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-3">
          <div className="h-4 w-32 bg-zinc-200 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-zinc-100 px-6 py-4 flex items-center gap-6">
            <div className="h-4 w-36 bg-zinc-100 rounded" />
            <div className="h-4 w-24 bg-zinc-100 rounded" />
            <div className="h-5 w-16 bg-zinc-100 rounded-full" />
            <div className="h-5 w-16 bg-zinc-100 rounded-full" />
            <div className="h-4 w-20 bg-zinc-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
