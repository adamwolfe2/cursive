export default function DataLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-24 bg-zinc-200 rounded" />
        <div className="h-4 w-56 bg-zinc-100 rounded" />
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <div className="h-5 w-40 bg-zinc-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-full bg-zinc-50 rounded mb-3" />
        ))}
      </div>
    </div>
  )
}
