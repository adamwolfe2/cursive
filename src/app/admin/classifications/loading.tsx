export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-52 rounded bg-zinc-200" />
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-zinc-200" />
        ))}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-3 flex gap-4">
          <div className="h-4 w-20 bg-zinc-200 rounded" />
          <div className="h-4 w-28 bg-zinc-200 rounded" />
          <div className="h-4 w-24 bg-zinc-200 rounded" />
          <div className="h-4 w-16 bg-zinc-200 rounded" />
          <div className="h-4 w-32 bg-zinc-200 rounded" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b border-zinc-100 px-6 py-3 flex items-center gap-6">
            <div className="h-5 w-16 bg-zinc-100 rounded-full" />
            <div className="h-4 w-20 bg-zinc-100 rounded" />
            <div className="h-4 w-20 bg-zinc-100 rounded" />
            <div className="h-4 w-48 bg-zinc-100 rounded" />
            <div className="h-4 w-28 bg-zinc-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
