export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-zinc-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2">
            <div className="h-4 w-24 bg-zinc-100 rounded" />
            <div className="h-8 w-20 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-32 bg-zinc-200 rounded" />
        <div className="h-12 w-full bg-zinc-100 rounded" />
        <div className="h-9 w-28 bg-zinc-200 rounded" />
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div className="h-5 w-28 bg-zinc-200 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 border border-zinc-100 rounded">
              <div className="h-4 w-40 bg-zinc-100 rounded" />
              <div className="h-4 w-20 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
