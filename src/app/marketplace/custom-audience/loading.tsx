export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 bg-zinc-200 rounded" />
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-40 bg-zinc-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-28 bg-zinc-200 rounded" />
              <div className="h-9 w-full bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-36 bg-zinc-200 rounded" />
        <div className="h-32 w-full bg-zinc-100 rounded" />
        <div className="h-9 w-28 bg-zinc-200 rounded" />
      </div>
    </div>
  )
}
