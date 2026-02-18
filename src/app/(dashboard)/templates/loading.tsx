export default function TemplatesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 bg-white border border-zinc-200 rounded-lg">
            <div className="h-5 w-40 bg-zinc-200 rounded mb-3" />
            <div className="space-y-2 mb-4">
              <div className="h-3 w-full bg-zinc-100 rounded" />
              <div className="h-3 w-2/3 bg-zinc-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
