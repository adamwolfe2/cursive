export default function CRMLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-zinc-200 rounded" />
          <div className="h-4 w-56 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg">
        <div className="p-4 border-b border-zinc-100 flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-24 bg-zinc-200 rounded" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-zinc-50 flex gap-4">
            <div className="h-4 w-32 bg-zinc-100 rounded" />
            <div className="h-4 w-48 bg-zinc-100 rounded" />
            <div className="h-4 w-24 bg-zinc-100 rounded" />
            <div className="h-4 w-20 bg-zinc-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
